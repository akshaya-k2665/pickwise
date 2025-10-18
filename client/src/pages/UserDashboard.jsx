// src/pages/UserDashboard.jsx
import React, { useEffect, useState } from "react";
import { getPreferences, getRecommendations } from "../api";

function UserDashboard() {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // ✅ Fetch preferences
      getPreferences(parsedUser.email)
        .then((res) => {
          setPreferences(res.data);
        })
        .catch(() => {
          setMessage("❌ Failed to fetch preferences");
        });

      // ✅ Fetch recommendations
      getRecommendations(parsedUser.email)
        .then((res) => {
          const recs = res.data.recommendations || res.data;
          setRecommendations(recs);
        })
        .catch(() => {
          setMessage("❌ Failed to fetch recommendations");
        });
    }
  }, []);

  if (!user) {
    return <p>Loading user...</p>;
  }

  return (
    <div className="user-dashboard" style={{ padding: "2rem" }}>
      <h2>👤 User Dashboard</h2>
      <p>
        <strong>Name:</strong> {user.name} <br />
        <strong>Email:</strong> {user.email} <br />
        <strong>Role:</strong> {user.role}
      </p>

      <h3>🎯 Your Preferences</h3>
      {preferences ? (
        <pre>{JSON.stringify(preferences, null, 2)}</pre>
      ) : (
        <p>No preferences found</p>
      )}

      <h3>🎬 Recommendations for You</h3>
      {recommendations.length > 0 ? (
        <ul>
          {recommendations.map((movie, index) => (
            <li key={index}>{movie}</li>
          ))}
        </ul>
      ) : (
        <p>No recommendations available</p>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}

export default UserDashboard;
