console.log("ClickUp content script loaded ✅");

// ─────────────────────────────────────────────
// Debounce helper
// ─────────────────────────────────────────────
function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// ─────────────────────────────────────────────
// Extract taskId patterns
// ─────────────────────────────────────────────
function extractTaskIdFromACPattern(email) {
  if (!email) return null;
  const m = email.match(/a\.c\.([a-zA-Z0-9]+)\./i);
  return m ? m[1] : null;
}

function extractTaskIdFromPlusPattern(email) {
  if (!email) return null;
  const m = email.match(/task\+([a-zA-Z0-9-_]+)@tasks\.clickup\.com/i);
  return m ? m[1] : null;
}

// ─────────────────────────────────────────────
// Collect CC emails
// ─────────────────────────────────────────────
function collectCCEmails() {
  const emails = new Set();

  document.querySelectorAll("[email]").forEach(el => {
    const e = el.getAttribute("email");
    if (e) emails.add(e.trim());
  });

  document.querySelectorAll("[data-hovercard-id]").forEach(el => {
    const e = el.getAttribute("data-hovercard-id");
    if (e) emails.add(e.trim());
  });

  const root = document.querySelector("div[role='main']") || document.body;
  if (root) {
    const text = root.innerText || "";
    const regex = /\b[a-zA-Z0-9._%+-]+@tasks\.clickup\.com\b/g;
    let m;
    while ((m = regex.exec(text)) !== null) {
      emails.add(m[0]);
    }
  }

  return Array.from(emails);
}

// ─────────────────────────────────────────────
// Detect viewer email
// ─────────────────────────────────────────────
function detectViewerEmail() {
  try {
    const acct = document.querySelector("a[aria-label*='Google Account']");
    if (acct) {
      const lbl = acct.getAttribute("aria-label");
      const m = lbl && lbl.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/);
      if (m) return m[1];
    }

    const avatar = document.querySelector("img[alt*='Google Account']");
    if (avatar) {
      const alt = avatar.getAttribute("alt") || "";
      const m = alt.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/);
      if (m) return m[1];
    }
  } catch (err) {
    console.warn("Viewer email detect failed", err);
  }

  return null;
}

// ─────────────────────────────────────────────
// Main logic (SAFE VERSION)
// ─────────────────────────────────────────────
const updateStorage = debounce(() => {
  try {
    if (!chrome?.storage?.local) return;

    const ccEmails = collectCCEmails();
    const taskEmails = ccEmails.filter(e =>
      e.toLowerCase().includes("@tasks.clickup.com")
    );

    const mappings = [];

    taskEmails.forEach(email => {
      let id = extractTaskIdFromACPattern(email);
      if (!id) id = extractTaskIdFromPlusPattern(email);
      if (id) mappings.push({ taskId: id, email });
    });

    // Deduplicate
    const unique = [];
    const seen = new Set();
    for (const m of mappings) {
      if (!seen.has(m.taskId)) {
        unique.push(m);
        seen.add(m.taskId);
      }
    }

    const viewer = detectViewerEmail();

    chrome.storage.local.get(
      ["taskMappings", "currentViewerEmail"],
      prev => {
        const prevMappings = prev?.taskMappings || [];
        const prevViewer = prev?.currentViewerEmail || null;

        const changed =
          JSON.stringify(prevMappings) !== JSON.stringify(unique) ||
          prevViewer !== viewer;

        if (changed) {
          chrome.storage.local.set({
            taskMappings: unique,
            currentViewerEmail: viewer,
            lastSeenAt: Date.now(),
          });

          console.log("🔁 Updated taskMappings:", { unique, viewer });
        }
      }
    );
  } catch (err) {
    console.error("ClickUp content-script error:", err);
  }
}, 500);

// ─────────────────────────────────────────────
// Observe Gmail DOM safely
// ─────────────────────────────────────────────
function startObserver() {
  if (!document.body) {
    setTimeout(startObserver, 500);
    return;
  }

  const observer = new MutationObserver(updateStorage);
  observer.observe(document.body, { childList: true, subtree: true });

  setInterval(updateStorage, 3000);
  setTimeout(updateStorage, 1500);
}

startObserver();
