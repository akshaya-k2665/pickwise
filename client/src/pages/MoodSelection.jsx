/* eslint-disable no-unused-vars */
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Mood.css";

const moodMap = {
  Happy: "comedy",
  Excited: "adventure",
  Calm: "drama",
  Romantic: "romance",
  Melancholic: "uplifting",
  Energetic: "action",
  Thoughtful: "mystery",
  Adventurous: "exploration",
};

const MoodSelection = () => {
  const navigate = useNavigate();

  const handleMoodClick = (mood) => {
    const genre = moodMap[mood];
    navigate(`/mood/movies/${genre}`);
  };

  return (
    <div className="mood-container">
      <h2>🎭 Select Your Mood</h2>
      <div className="mood-grid">
        {Object.keys(moodMap).map((mood) => (
          <div
            key={mood}
            className="mood-card"
            onClick={() => handleMoodClick(mood)}
          >
            {mood}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoodSelection;