function getTaskIdFromCC() {
  const ccSpans = Array.from(document.querySelectorAll('span[email]'));
  for (let span of ccSpans) {
    const email = span.getAttribute("email");
    if (email && email.includes("@tasks.clickup.com")) {
      const match = email.match(/\.([a-zA-Z0-9]{8,10})\./);
      if (match) return { taskId: match[1], email };
    }
  }
  return null;
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "GET_TASK_ID") {
    // Wait up to 10 seconds for CC to appear
    let task = null;
    const start = Date.now();
    while (!task && Date.now() - start < 10000) {
      task = getTaskIdFromCC();
      if (!task) await new Promise(r => setTimeout(r, 500));
    }
    sendResponse(task);
  }
  return true;
});


