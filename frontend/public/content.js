console.log("ClickUp content script loaded ✅");

function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function extractTaskIdFromEmail(email) {
  if (!email) return null;
  const m = email.match(/a\.c\.([a-zA-Z0-9]+)\./i);
  return m ? m[1] : null;
}

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
  } catch {}
  return null;
}

const updateStorage = debounce(() => {
  const ccEmails = collectCCEmails();
  const foundEmail = ccEmails.find((e) => e.includes("@tasks.clickup.com")) || null;
  const taskId = extractTaskIdFromEmail(foundEmail);
  const viewer = detectViewerEmail();

  chrome.storage.local.get(["currentTaskId", "currentViewerEmail"], (prev) => {
    const prevId = prev.currentTaskId || null;
    const prevViewer = prev.currentViewerEmail || null;
    if (prevId !== taskId || prevViewer !== viewer) {
      chrome.storage.local.set({
        currentTaskId: taskId || null,
        currentViewerEmail: viewer || null,
        lastSeenAt: Date.now(),
      });
      console.log("🔁 Updated task info:", { taskId, viewer });
    }
  });
}, 500);

// Observe Gmail body for changes
const observer = new MutationObserver(updateStorage);
observer.observe(document.body, { childList: true, subtree: true });

// 🔄 Force update every 3 seconds
setInterval(updateStorage, 3000);

// Run once after small delay
setTimeout(updateStorage, 1500);
