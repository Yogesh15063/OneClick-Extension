import React, { useEffect, useState } from "react";

export default function App() {
  const backend = "http://localhost:5000";
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [task, setTask] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Listen for OAuth popup returning user info
  useEffect(() => {
    const handler = (event) => {
      if (event.data?.clickup_user_id) {
        localStorage.setItem("clickup_user_id", event.data.clickup_user_id);
        localStorage.setItem("clickup_email", event.data.clickup_email);
        setConnected(true);
        setUser({ id: event.data.clickup_user_id, email: event.data.clickup_email });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // ✅ Check backend connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch(`${backend}/auth/clickup/user`);
        if (!res.ok) return;
        const data = await res.json();
        setConnected(true);
        setUser(data.user);
        localStorage.setItem("clickup_user_id", data.user.user_id);
      } catch {}
    };
    checkConnection();
  }, []);

  const connectClickUp = () => {
    window.open(`${backend}/auth/clickup`, "_blank", "width=600,height=700");
  };

  const fetchTask = async () => {
    setLoading(true);
    setError("");
    setTask(null);

    try {
      const userId = localStorage.getItem("clickup_user_id");
      const { currentTaskId } = await chrome.storage.local.get("currentTaskId");
      if (!userId || !currentTaskId) {
        setError("Missing user or task ID");
        setLoading(false);
        return;
      }

      const res = await fetch(`${backend}/auth/clickup/task/${userId}/${currentTaskId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch");

      setTask(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts) => (ts ? new Date(parseInt(ts)).toLocaleDateString() : "No due date");

  return (
    <div style={{ fontFamily: "system-ui", width: 350, padding: 12 }}>
      <h3>ClickUp Helper</h3>

      {!connected ? (
        <button onClick={connectClickUp}>Connect ClickUp</button>
      ) : (
        <div>✅ Connected as {user?.email}</div>
      )}

      <button style={{ marginTop: 10 }} onClick={fetchTask} disabled={!connected || loading}>
        {loading ? "Loading..." : "Fetch Task"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {task && (
        <div
          style={{
            marginTop: 12,
            background: "#f8f8f8",
            padding: 10,
            borderRadius: 6,
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          <h4 style={{ marginBottom: 4 }}>{task.name}</h4>
          <p style={{ margin: 0, color: "#555" }}>
            {task.description || "No description available"}
          </p>

          <hr style={{ margin: "8px 0" }} />

          <p>
            <b>Status:</b>{" "}
            <span
              style={{
                background: task.status?.color || "#999",
                color: "#fff",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {task.status?.status || "—"}
            </span>
          </p>

          <p>
            <b>Priority:</b>{" "}
            <span
              style={{
                background: task.priority?.color || "#ccc",
                color: "#fff",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {task.priority?.priority || "N/A"}
            </span>
          </p>

          <p>
            <b>Due Date:</b> {formatDate(task.due_date)}
          </p>

          <p>
            <b>List:</b> {task.list?.name || "—"}
          </p>

          <p>
            <b>Creator:</b> {task.creator?.username} ({task.creator?.email})
          </p>

          <p>
            <b>Assignees:</b>{" "}
            {task.assignees?.length
              ? task.assignees.map((a) => `${a.username} (${a.email})`).join(", ")
              : "None"}
          </p>

          {task.attachments?.length > 0 && (
            <div>
              <b>Attachments:</b>
              <ul style={{ marginTop: 4, paddingLeft: 18 }}>
                {task.attachments.map((att) => (
                  <li key={att.id}>
                    <a href={att.url} target="_blank" rel="noreferrer">
                      {att.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <a
            href={task.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "block",
              background: "#007bff",
              color: "white",
              textAlign: "center",
              padding: "6px 0",
              borderRadius: 5,
              marginTop: 8,
              textDecoration: "none",
            }}
          >
            Open in ClickUp
          </a>
        </div>
      )}
    </div>
  );
}
