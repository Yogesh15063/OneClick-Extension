console.log("ClickUp content script loaded ✅");

// Debounce helper
function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// Extract taskId from ClickUp forwarding email like: a.c.xyz123. (existing pattern)
function extractTaskIdFromACPattern(email) {
  if (!email) return null;
  const m = email.match(/a\.c\.([a-zA-Z0-9]+)\./i);
  return m ? m[1] : null;
}

// Extract taskId from task+<id>@tasks.clickup.com pattern (more common)
function extractTaskIdFromPlusPattern(email) {
  if (!email) return null;
  const m = email.match(/task\+([a-zA-Z0-9-_]+)@tasks\.clickup\.com/i);
  return m ? m[1] : null;
}

// Collect ALL CC emails (including ClickUp task emails)
function collectCCEmails() {
  const emails = new Set();

  // elements with email attribute (Gmail uses these)
  document.querySelectorAll("[email]").forEach((el) => {
    const e = el.getAttribute("email");
    if (e) emails.add(e.trim());
  });

  // hovercards might contain data-hovercard-id
  document.querySelectorAll("[data-hovercard-id]").forEach((el) => {
    const e = el.getAttribute("data-hovercard-id");
    if (e) emails.add(e.trim());
  });

  // fallback: search entire main view text for clickup task emails
  const header = document.querySelector("div[role='main']") || document.body;
  if (header) {
    const text = header.innerText || "";
    const regex = /\b[a-zA-Z0-9._%+-]+@tasks\.clickup\.com\b/g;
    let m;
    while ((m = regex.exec(text)) !== null) {
      emails.add(m[0]);
    }
  }

  return Array.from(emails);
}

// Detect viewer email (Gmail account)
function detectViewerEmail() {
  try {
    const acct = document.querySelector("a[aria-label*='Google Account']");
    if (acct) {
      const lbl = acct.getAttribute("aria-label");
      const m = lbl && lbl.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/);
      return m ? m[1] : null;
    }

    const avatar = document.querySelector("img[alt*='Google Account']");
    if (avatar) {
      const alt = avatar.getAttribute("alt") || "";
      const m = alt.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/);
      return m ? m[1] : null;
    }
  } catch {}

  return null;
}

// Main detection function — now creates stable mappings { taskId, email }
const updateStorage = debounce(() => {
  const ccEmails = collectCCEmails();

  // filter to only ClickUp forwarding emails (best-effort)
  const taskEmails = ccEmails.filter((e) => e.toLowerCase().includes("@tasks.clickup.com"));

  // create mapping pairs { taskId, email }
  const mappings = [];

  taskEmails.forEach((email) => {
    // try both patterns
    let id = extractTaskIdFromACPattern(email);
    if (!id) id = extractTaskIdFromPlusPattern(email);
    if (id) {
      mappings.push({
        taskId: id,
        email,
      });
    }
  });

  // Remove duplicates by taskId (keep first occurrence)
  const unique = [];
  const seen = new Set();
  for (const m of mappings) {
    if (!seen.has(m.taskId)) {
      unique.push(m);
      seen.add(m.taskId);
    }
  }

  const viewer = detectViewerEmail();

  chrome.storage.local.get(["taskMappings", "currentViewerEmail"], (prev) => {
    const prevMappings = prev.taskMappings || [];
    const prevViewer = prev.currentViewerEmail || null;

    const changed =
      JSON.stringify(prevMappings) !== JSON.stringify(unique) || prevViewer !== viewer;

    if (changed) {
      chrome.storage.local.set({
        taskMappings: unique,
        currentViewerEmail: viewer,
        lastSeenAt: Date.now(),
      });

      console.log("🔁 Updated taskMappings:", { unique, viewer });
    }
  });
}, 500);

// Observe Gmail changes
const observer = new MutationObserver(updateStorage);
observer.observe(document.body, { childList: true, subtree: true });

// Refresh every 3s as fallback
setInterval(updateStorage, 3000);

// Initial run
setTimeout(updateStorage, 1500);
