// src/pages/MusicPage.jsx
import React, { useEffect, useState } from "react";
import { getRecommendations } from "../api";
import "../styles/RecommendationPages.css";

const MusicPage = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const { data } = await getRecommendations(user.email, "music");
        setSongs(data.recommendations || []);
      } catch (err) {
        console.error("❌ Error fetching music recommendations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, [user.email]);

  if (loading) return <div className="loading-text">🎵 Fetching music recommendations...</div>;

  return (
    <div className="recommendations-container">
      <h2>🎵 Music Recommendations</h2>

      {songs.length === 0 ? (
        <p className="empty-text">No music recommendations found. Try updating your preferences!</p>
      ) : (
        <div className="recommendation-grid">
          {songs.map((song, index) => (
            <div key={index} className="recommendation-card">
              <img
                src={song.artwork || "https://via.placeholder.com/200x200.png?text=No+Cover"}
                alt={song.title}
                className="recommendation-img"
              />
              <div className="recommendation-info">
                <h3>{song.title}</h3>
                <p>🎤 {song.artist}</p>
                <p>💿 {song.album}</p>
                {song.previewUrl && (
                  <audio controls className="preview-audio">
                    <source src={song.previewUrl} type="audio/mpeg" />
                    Your browser does not support audio playback.
                  </audio>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MusicPage;
