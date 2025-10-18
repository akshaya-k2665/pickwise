// p4/client/src/pages/AdminDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1 className="admin-title">⚙ Admin Dashboard</h1>
        <p className="admin-subtitle">Manage users, view analytics, and review feedback.</p>
      </div>

      <div className="admin-grid">
        <div className="admin-card" onClick={() => navigate("/admin/users")}>
          <div className="admin-icon">🧍‍♀</div>
          <h3 className="admin-card-title">Users</h3>
          <p className="admin-card-desc">Manage accounts, roles and activity.</p>
        </div>

        <div className="admin-card" onClick={() => navigate("/admin/analytics")}>
          <div className="admin-icon">📊</div>
          <h3 className="admin-card-title">Analytics</h3>
          <p className="admin-card-desc">Logins this week and new signups.</p>
        </div>

        <div className="admin-card" onClick={() => navigate("/admin/feedback")}>
          <div className="admin-icon">💬</div>
          <h3 className="admin-card-title">Feedback</h3>
          <p className="admin-card-desc">Review user comments and reactions.</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;