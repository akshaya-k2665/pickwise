// p6/client/src/pages/Admin/FeedbackPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import "../../styles/AdminFeedback.css";

export default function FeedbackPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [filterBy, setFilterBy] = useState("all"); // all | username | movie

  const [selected, setSelected] = useState(null); // for modal
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await API.get("/admin/feedback");
        const data = res?.data?.data || res?.data || [];
        // Normalize entries to ensure fields exist
        const normalized = Array.isArray(data)
          ? data.map((d) => ({
              id: d.id || d._id,
              userName: d.userName || d.user || d.name || "",
              userEmail: d.userEmail || d.email || "",
              movieTitle: d.movieTitle || d.title || d.type || "",
              contentId: d.contentId || "",
              type: d.type || "",
              feedback: d.feedback || "",
              review: d.review || "",
              createdAt: d.createdAt || d.timestamp || null,
            }))
          : [];
        setItems(normalized);
      } catch (e) {
        console.error("❌ Failed to fetch admin feedback:", e);
        setError("Failed to load feedback. Ensure you're logged in as admin.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const byUser = `${it.userName} ${it.userEmail}`.toLowerCase();
      const byMovie = `${it.movieTitle} ${it.type}`.toLowerCase();
      if (filterBy === "username") return byUser.includes(q);
      if (filterBy === "movie") return byMovie.includes(q);
      return byUser.includes(q) || byMovie.includes(q);
    });
  }, [items, query, filterBy]);

  const onRowClick = (it) => setSelected(it);
  const closeModal = () => setSelected(null);

  if (loading) return <p style={{ color: "white", padding: "1rem" }}>⏳ Loading feedback...</p>;

  return (
    <div className="feedback-admin-page">
      <div className="page-header">
        <button onClick={() => navigate("/admin")} className="analytics-back">
          ← Back to Admin Dashboard
        </button>
        <h2 className="page-title">💬 Feedback Management</h2>
      </div>

      {error && <p className="page-error">{error}</p>}

      <div className="controls">
        <div className="search-wrap">
          <input
            className="search-input"
            type="text"
            placeholder="Search feedback..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="filter-wrap">
          <label className="filter-label">Filter by</label>
          <select
            className="filter-select"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option value="all">All</option>
            <option value="username">Username</option>
            <option value="movie">Movie</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="feedback-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Movie Title</th>
              <th>Feedback</th>
              <th>Comment</th>
              <th>Date Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => (
              <tr key={it.id} onClick={() => onRowClick(it)} className="row-hover">
                <td>
                  <div className="user-col">
                    <span className="user-name">{it.userName || "—"}</span>
                    <span className="user-email">{it.userEmail || ""}</span>
                  </div>
                </td>
                <td>{it.movieTitle || it.type || "—"}</td>
                <td>
                  <span
                    className={`badge ${
                      it.feedback === "like"
                        ? "badge-like"
                        : it.feedback === "dislike"
                        ? "badge-dislike"
                        : "badge-neutral"
                    }`}
                  >
                    {it.feedback || "—"}
                  </span>
                </td>
                <td className="comment-cell">
                  {it.review ? (
                    <span title={it.review}>{it.review}</span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  {it.createdAt ? new Date(it.createdAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  No feedback found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Feedback Details</h3>
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="label">User</span>
                <span className="value">
                  {selected.userName || "—"}
                  {selected.userEmail ? ` (${selected.userEmail})` : ""}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Movie</span>
                <span className="value">
                  {selected.movieTitle || selected.type || selected.contentId || "—"}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Reaction</span>
                <span className="value">
                  <span
                    className={`badge ${
                      selected.feedback === "like"
                        ? "badge-like"
                        : selected.feedback === "dislike"
                        ? "badge-dislike"
                        : "badge-neutral"
                    }`}
                  >
                    {selected.feedback || "—"}
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Comment</span>
                <span className="value wrap">
                  {selected.review || <span className="muted">—</span>}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Date</span>
                <span className="value">
                  {selected.createdAt
                    ? new Date(selected.createdAt).toLocaleString()
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
