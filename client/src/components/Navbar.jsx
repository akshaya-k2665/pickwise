import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar({ showOnlyLogout = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // ✅ Load user from localStorage safely
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
      }
    }
  }, []);

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userPreferences");
    localStorage.removeItem("selectedCategory"); // clear category too
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">🎬 PickWise</Link>
      </div>

      {showOnlyLogout ? (
        // ✅ Show only Logout button on /choose
        <div className="navbar-logout-only">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      ) : (
        // ✅ Full Navbar (after user chooses "Movies")
        <div className="navbar-links">
          <Link to="/Home">Home</Link>
          <Link to="/moodboard">Mood-Based</Link>

          {/* 👤 User-only link */}
          {user && user.role === "user" && (
            <Link to="/preferences">Preferences</Link>
          )}

          {/* 🛠️ Admin-only link */}
          {user && user.role === "admin" && (
            <Link to="/admin">Admin Dashboard</Link>
          )}

          {/* Display username */}
          {user && <span className="user-info">Hi, {user.name || "User"}</span>}
        </div>
      )}
    </nav>
  );
}

export default Navbar;

