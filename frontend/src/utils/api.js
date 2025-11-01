export const getBackendUrl = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get("BACKEND_URL", (data) => {
      resolve(data.BACKEND_URL || "http://localhost:5000");
    });
  });
};
