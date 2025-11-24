console.log("ClickUp content script loaded ✅");

// Debounce helper
function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// Extract taskId from ClickUp forwarding email like: a.c.xyz123.
function extractTaskIdFromEmail(email) {
  if (!email) return null;
  const m = email.match(/a\.c\.([a-zA-Z0-9]+)\./i);
  return m ? m[1] : null;
}

// Collect ALL CC emails (including ClickUp task emails)
function collectCCEmails() {
  const emails = new Set();

  document.querySelectorAll("[email]").forEach((el) => {
    const e = el.getAttribute("email");
    if (e) emails.add(e.trim());
  });

  document.querySelectorAll("[data-hovercard-id]").forEach((el) => {
    const e = el.getAttribute("data-hovercard-id");
    if (e) emails.add(e.trim());
  });

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
  } catch {}

  return null;
}

// Main detection function — now supports MULTIPLE task IDs
const updateStorage = debounce(() => {
  const ccEmails = collectCCEmails();

  const taskEmails = ccEmails.filter((e) => e.includes("@tasks.clickup.com"));

  // Extract all task IDs
  const taskIds = taskEmails
    .map((e) => extractTaskIdFromEmail(e))
    .filter(Boolean);

  const viewer = detectViewerEmail();

  chrome.storage.local.get(["currentTaskIds", "currentViewerEmail"], (prev) => {
    const prevIds = prev.currentTaskIds || [];
    const prevViewer = prev.currentViewerEmail || null;

    const changed =
      JSON.stringify(prevIds) !== JSON.stringify(taskIds) ||
      prevViewer !== viewer;

    if (changed) {
      chrome.storage.local.set({
        currentTaskIds: taskIds,
        currentViewerEmail: viewer,
        lastSeenAt: Date.now(),
      });

      console.log("🔁 Updated multi-task info:", { taskIds, viewer });
    }
  });
}, 500);

// Observe Gmail changes
const observer = new MutationObserver(updateStorage);
observer.observe(document.body, { childList: true, subtree: true });

// Refresh every 3s
setInterval(updateStorage, 3000);

// Initial run
setTimeout(updateStorage, 1500);
