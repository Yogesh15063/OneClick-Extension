import React, { useEffect, useState } from "react";
import { getTaskById } from "./utils/clickup";

function App() {
  const [task, setTask] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "GET_TASK_ID" }, async (response) => {
        if (chrome.runtime.lastError) {
          setError("Extension not injected into this page.");
          return;
        }
        if (!response?.taskId) {
          setError("No ClickUp task detected in CC");
          return;
        }
        try {
          const data = await getTaskById(response.taskId);
          if (data) setTask(data);
          else setError("Failed to fetch task from backend");
        } catch {
          setError("Failed to fetch task from backend");
        }
      });
    });
  }, []);

  if (error) return <div style={{ padding: "10px" }}>{error}</div>;
  if (!task) return <div style={{ padding: "10px" }}>Loading...</div>;

  return (
    <div style={{ padding: "10px", width: "300px" }}>
      <h3>{task.name}</h3>
      <p><strong>Status:</strong> {task.status?.status}</p>
      <p><strong>Assignees:</strong> {task.assignees.map(a => a.username).join(", ")}</p>
      <p><strong>Description:</strong> {task.description}</p>
      <a href={task.url} target="_blank" rel="noreferrer">Open in ClickUp</a>
    </div>
  );
}

export default App;
