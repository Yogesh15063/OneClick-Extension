chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_TASK_ID") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        { target: { tabId: tabs[0].id }, files: ["contentScript.js"] },
        () => {
          sendResponse({ status: "script injected" });
        }
      );
    });
    return true;
  }
});



