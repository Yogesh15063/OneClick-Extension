chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ ClickUp Extension installed");
  chrome.storage.local.set({ BACKEND_URL: "http://localhost:5000" });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "getCurrentEmail") {
    chrome.storage.local.get("current_email", (data) => {
      sendResponse(data.current_email);
    });
    return true; // Keep message channel open
  }
});
