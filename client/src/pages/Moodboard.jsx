/* eslint-disable no-unused-vars */
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Moodboard.css";

const moods = [
  { name: "Happy", emoji: "😊", color: "#FFD54F" },
  { name: "Excited", emoji: "🤩", color: "#FF6F61" },
  { name: "Calm", emoji: "😌", color: "#81C784" },
  { name: "Romantic", emoji: "💖", color: "#F06292" },
  { name: "Melancholic", emoji: "😔", color: "#64B5F6" },
  { name: "Energetic", emoji: "⚡", color: "#FFB300" },
  { name: "Thoughtful", emoji: "🤔", color: "#BA68C8" },
  { name: "Adventurous", emoji: "🚀", color: "#4DB6AC" },
];

const Moodboard = () => {
  const navigate = useNavigate();

  const handleMoodClick = (mood) => {
    navigate(`/moodboard/movies/${mood.toLowerCase()}`);
  };

  return (
    <div className="moodboard-page">
      <h2 className="moodboard-title">
        🎭 Choose Your <span>Mood</span>
      </h2>

      <div className="mood-grid">
        {moods.map((mood) => (
          <div
            key={mood.name}
            className="mood-card"
            style={{ "--mood-color": mood.color }}
            onClick={() => handleMoodClick(mood.name)}
          >
            <div className="emoji">{mood.emoji}</div>
            <div className="mood-name">{mood.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Moodboard;
