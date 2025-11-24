import React, { useEffect, useState } from "react";

export default function App() {
  const backend = "http://localhost:5000";
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ────────────────────────────────────────────────
  // Listen for OAuth popup
  // ────────────────────────────────────────────────
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

  // ────────────────────────────────────────────────
  // Check backend connection (user already logged in)
  // ────────────────────────────────────────────────
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

  // ────────────────────────────────────────────────
  // Auto-fetch tasks as soon as popup opens
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!connected) return;

    setTimeout(fetchAllTasks, 300);
  }, [connected]);

  // ────────────────────────────────────────────────
  // Fetch ALL tasks from multiple CC emails
  // ────────────────────────────────────────────────
  const fetchAllTasks = async () => {
    setLoading(true);
    setError("");
    setTasks([]);

    try {
      const userId = localStorage.getItem("clickup_user_id");
      const { currentTaskIds } = await chrome.storage.local.get("currentTaskIds");

      if (!userId) {
        setError("Not connected to ClickUp");
        setLoading(false);
        return;
      }

      if (!currentTaskIds || currentTaskIds.length === 0) {
        setError("No ClickUp task emails found in CC.");
        setLoading(false);
        return;
      }

      const results = [];

      for (const taskId of currentTaskIds) {
        try {
          const res = await fetch(`${backend}/auth/clickup/task/${userId}/${taskId}`);
          const data = await res.json();

          if (res.ok) results.push(data.data);
        } catch {}
      }

      if (results.length === 0) {
        setError("Failed to fetch tasks.");
      } else {
        setTasks(results);
      }
    } catch {
      setError("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts) =>
    ts ? new Date(parseInt(ts)).toLocaleDateString() : "No due date";

  // ────────────────────────────────────────────────
  // UI
  // ────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "system-ui", width: 350, padding: 12 }}>
      <h3>ClickUp Helper</h3>

      {!connected ? (
        <button onClick={connectClickUp}>Connect ClickUp</button>
      ) : (
        <div>✅ Connected as {user?.email}</div>
      )}

      {loading && <p>Loading tasks…</p>}
      {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}

      {/* Render multiple tasks */}
      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            marginTop: 12,
            background: "#f7f7f7",
            padding: 12,
            borderRadius: 6,
            fontSize: 13,
            lineHeight: 1.4,
            border: "1px solid #e0e0e0",
          }}
        >
          {/* ⭐ TITLE */}
          <h4 style={{ margin: "0 0 6px 0" }}>{task.name}</h4>

          {/* ⭐ STATUS */}
          <p style={{ margin: "4px 0" }}>
            <b>Status:</b>{" "}
            <span
              style={{
                background: task.status?.color || "#888",
                color: "#fff",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {task.status?.status || "—"}
            </span>
          </p>

          {/* ⭐ DUE DATE */}
          <p style={{ margin: "4px 0" }}>
            <b>Due Date:</b> {formatDate(task.due_date)}
          </p>

          {/* ⭐ LIST */}
          <p style={{ margin: "4px 0" }}>
            <b>List:</b> {task.list?.name || "—"}
          </p>

          {/* ⭐ ASSIGNEES */}
          <p style={{ margin: "4px 0" }}>
            <b>Assignees:</b>{" "}
            {task.assignees?.length
              ? task.assignees.map((a) => a.username).join(", ")
              : "Nobody assigned"}
          </p>

          {/* ⭐ OPEN BUTTON */}
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
              marginTop: 10,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Open in ClickUp
          </a>
        </div>
      ))}
    </div>
  );
}
