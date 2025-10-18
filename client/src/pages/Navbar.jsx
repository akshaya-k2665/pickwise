import { useEffect, useState } from "react";
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
    localStorage.removeItem("selectedCategory");
    setUser(null);
    navigate("/login");
  };

  // ✅ If no user logged in, still show minimal Navbar
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">🎬 PickWise</Link>
      </div>

      {showOnlyLogout ? (
        // ✅ Show only Logout button if showOnlyLogout flag is true
        <div className="navbar-logout-only">
          {user && (
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          )}
        </div>
      ) : (
        // ✅ Full Navbar (visible to both users & admins)
        <div className="navbar-links">
          <Link to="/Home">Home</Link>

          {/* 🚫 Hide Mood-Based for Admins */}
          {user?.role !== "admin" && <Link to="/moodboard">Mood-Based</Link>}

          {/* 👤 User-only link */}
          {user && user.role === "user" && (
            <Link to="/preferences">Preferences</Link>
          )}

          {/* 🛠 Admin-only link */}
          {user && user.role === "admin" && (
            <Link to="/admin">Admin Dashboard</Link>
          )}

          {/* Display username */}
          {user && <span className="user-info">Hi, {user.name || "User"}</span>}

          {/* ✅ Always show Logout when user is logged in */}
          {user && (
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;