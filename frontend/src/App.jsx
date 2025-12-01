import React, { useEffect, useState } from "react";

export default function App() {
  const backend = "http://localhost:5000";
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);

  const [tasks, setTasks] = useState([]); // array of { task, email, taskId, error? }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // promisified storage.get helper
  const getStorage = (keys) =>
    new Promise((resolve) => {
      chrome.storage.local.get(keys, (res) => resolve(res));
    });

  // ────────────────────────────────────────────────
  // Listen for OAuth popup
  // ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (event) => {
      if (event.data?.clickup_user_id) {
        localStorage.setItem("clickup_user_id", event.data.clickup_user_id);
        localStorage.setItem("clickup_email", event.data.clickup_email);

        setConnected(true);
        setUser({
          id: event.data.clickup_user_id,
          email: event.data.clickup_email,
        });
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // ────────────────────────────────────────────────
  // Check backend session (if already logged in)
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

  const connectClickUp = () =>
    window.open(`${backend}/auth/clickup`, "_blank", "width=600,height=700");

  // ────────────────────────────────────────────────
  // Auto-fetch tasks as soon as popup opens and connected
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!connected) return;
    // small delay to let content-script update storage
    const t = setTimeout(fetchAllTasks, 300);
    return () => clearTimeout(t);
  }, [connected]);

  // ────────────────────────────────────────────────
  // Fetch ALL tasks based on taskMappings and preserve email mapping
  // ────────────────────────────────────────────────
  const fetchAllTasks = async () => {
    setLoading(true);
    setError("");
    setTasks([]);

    try {
      const userId = localStorage.getItem("clickup_user_id");
      if (!userId) {
        setError("Not connected to ClickUp");
        setLoading(false);
        return;
      }

      const storage = await getStorage(["taskMappings"]);
      const mappings = storage.taskMappings || [];

      if (!mappings || mappings.length === 0) {
        setError("No ClickUp task emails found in CC.");
        setLoading(false);
        return;
      }

      const results = [];

      // For each mapping, try to fetch the task and attach the email
      for (const map of mappings) {
        const { taskId, email } = map;
        try {
          const res = await fetch(`${backend}/auth/clickup/task/${userId}/${taskId}`);
          const data = await res.json();
          if (res.ok && data?.data) {
            results.push({ task: data.data, email, taskId });
          } else {
            // push an error object so user knows fetch failed for this task
            results.push({
              task: null,
              email,
              taskId,
              error: data?.error || "Failed to fetch task",
            });
          }
        } catch (err) {
          results.push({
            task: null,
            email,
            taskId,
            error: err?.message || "Network error",
          });
        }
      }

      // If nothing successful, keep results anyway so UI can show errors per item
      setTasks(results);
    } catch (err) {
      console.error(err);
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

      {/* Render multiple tasks (with email mapping and per-item errors) */}
      {tasks.map((item) => {
        const { task, email, taskId, error: itemError } = item;
        return (
          <div
            key={task ? task.id : taskId}
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
            {/* Task email */}
            <p
              style={{
                color: "#666",
                margin: "0 0 8px 0",
                fontSize: 12,
                wordBreak: "break-all",
              }}
            >
              <b>Email:</b> {email || "Unknown email"}
            </p>

            {itemError ? (
              <p style={{ color: "red", margin: "6px 0" }}>
                {itemError}
              </p>
            ) : (
              <>
                {/* TITLE */}
                <h4 style={{ margin: "0 0 6px 0" }}>{task.name}</h4>

                {/* STATUS */}
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

                {/* DUE DATE */}
                <p style={{ margin: "4px 0" }}>
                  <b>Due Date:</b> {formatDate(task.due_date)}
                </p>

                {/* LIST */}
                <p style={{ margin: "4px 0" }}>
                  <b>List:</b> {task.list?.name || "—"}
                </p>

                {/* ASSIGNEES */}
                <p style={{ margin: "4px 0" }}>
                  <b>Assignees:</b>{" "}
                  {task.assignees?.length
                    ? task.assignees.map((a) => a.username).join(", ")
                    : "Nobody assigned"}
                </p>

                {/* OPEN BUTTON */}
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
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
