// p4/client/src/pages/admin/UsersPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api"; // ✅ use the configured Axios instance
import "../../styles/AdminAnalytics.css"; // for .analytics-back button style

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await API.get("/admin/users"); // ✅ correct endpoint
        // unwrap response safely
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
          ? res.data.data
          : [];
        setUsers(data);
      } catch (err) {
        console.error("❌ Failed to fetch users:", err);
        setError("Failed to load users. You may not have admin access.");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);
  if (loading) return <p style={{ color: "white" }}>⏳ Loading users...</p>;

  return (
    <div style={{ padding: "2rem", color: "white" }}>
      <button onClick={() => navigate("/admin")} className="analytics-back">
        ← Back to Admin Dashboard
      </button>

      <h2 style={{ color: "violet", textAlign: "center" }}>👥 All Users</h2>

      {users.length > 0 ? (
        <table
          style={{
            width: "100%",
            background: "#111",
            color: "#fff",
            borderCollapse: "collapse",
            marginTop: "1rem",
          }}
        >
          <thead>
            <tr style={{ background: "#333" }}>
              <th style={{ padding: "8px" }}>Email</th>
              <th style={{ padding: "8px" }}>Role</th>
              <th style={{ padding: "8px" }}>Status</th>
              <th style={{ padding: "8px" }}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u._id || i} style={{ borderBottom: "1px solid #444" }}>
                <td style={{ padding: "8px" }}>{u.email || "—"}</td>
                <td style={{ padding: "8px" }}>{u.role || "—"}</td>
                <td style={{ padding: "8px" }}>{u.status || "—"}</td>
                <td style={{ padding: "8px" }}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ textAlign: "center" }}>No users found.</p>
      )}
    </div>
  );
}