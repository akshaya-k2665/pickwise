// p4/client/src/pages/admin/LogsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api"; // ✅ Use the configured Axios instance (with token)
import "../../styles/AdminAnalytics.css"; // for .analytics-back

function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLogs() {
      try {
        // ✅ Correct endpoint for admin logs
        const res = await API.get("/admin/logs");

        // Safely unwrap if wrapped in { data: [...] }
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
          ? res.data.data
          : [];
        setLogs(data);
      } catch (err) {
        console.error("❌ Failed to fetch logs:", err);
        setError("Failed to load logs. You may not have admin access.");
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  if (loading) return <p style={{ color: "white" }}>⏳ Loading logs...</p>;

  return (
    <div style={{ padding: "2rem", color: "white" }}>
      <button onClick={() => navigate("/admin")} className="analytics-back">
        ← Back to Admin Dashboard
      </button>

      <h2 style={{ color: "violet", textAlign: "center" }}>📝 System Logs</h2>

      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      {logs.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
          {logs.map((log, i) => (
            <li
              key={log._id || i}
              style={{
                background: "#111",
                marginBottom: "8px",
                padding: "10px",
                borderRadius: "8px",
                borderLeft: `5px solid ${
                  log.level === "ERROR"
                    ? "red"
                    : log.level === "WARN"
                    ? "orange"
                    : "lightgreen"
                }`,
                boxShadow: "0 0 5px rgba(255,255,255,0.1)",
              }}
            >
              <div>
                <strong style={{ color: "cyan" }}>
                  [{log.level || "INFO"}]
                </strong>{" "}
                — {log.message || "No message"}
              </div>
              <div style={{ color: "#aaa", fontSize: "0.9rem" }}>
                {log.time
                  ? new Date(log.time).toLocaleString()
                  : new Date().toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ textAlign: "center" }}>No logs available.</p>
      )}
    </div>
  );
}

export default LogsPage;