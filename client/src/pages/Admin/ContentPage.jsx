// p4/client/src/pages/admin/ContentPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api"; // ✅ Use the configured Axios instance with JWT token
import "../../styles/AdminAnalytics.css"; // reuse .analytics-back style

function ContentPage() {
  const [content, setContent] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchContent() {
      try {
        // ✅ Correct endpoint (admin protected)
        const res = await API.get("/admin/content");

        // Safely unwrap data if wrapped
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
          ? res.data.data
          : [];
        setContent(data);
      } catch (err) {
        console.error("❌ Failed to fetch content:", err);
        setError("Failed to load content. You may not have admin access.");
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, []);

  if (loading) return <p style={{ color: "white" }}>⏳ Loading content...</p>;

  return (
    <div style={{ padding: "2rem", color: "white" }}>
      <button onClick={() => navigate("/admin")} className="analytics-back">
        ← Back to Admin Dashboard
      </button>

      <h2 style={{ color: "violet", textAlign: "center" }}>📚 All Content</h2>

      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      {content.length > 0 ? (
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
              <th style={{ padding: "8px" }}>Title</th>
              <th style={{ padding: "8px" }}>Type</th>
              <th style={{ padding: "8px" }}>Category</th>
              <th style={{ padding: "8px" }}>Status</th>
              <th style={{ padding: "8px" }}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {content.map((c, i) => (
              <tr key={c._id || i} style={{ borderBottom: "1px solid #444" }}>
                <td style={{ padding: "8px" }}>{c.title || "—"}</td>
                <td style={{ padding: "8px" }}>{c.type || "—"}</td>
                <td style={{ padding: "8px" }}>{c.category || "—"}</td>
                <td style={{ padding: "8px" }}>{c.status || "—"}</td>
                <td style={{ padding: "8px" }}>
                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ textAlign: "center" }}>No content found.</p>
      )}
    </div>
  );
}

export default ContentPage;