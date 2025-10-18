// client/src/components/FeedbackForm.jsx
import React, { useState } from "react";
import API from "../api";

const FeedbackForm = ({ contentId, type, userId }) => {
  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState(null);

  const handleSubmit = async () => {
    try {
      await API.post("/feedback", {
        userId,
        contentId,
        type,
        rating,
        feedback: liked ? "like" : liked === false ? "dislike" : null,
      });
      alert("Feedback submitted!");
    } catch (err) {
      console.error("Error submitting feedback:", err);
    }
  };

  return (
    <div className="feedback-form">
      <h4>Rate this {type}</h4>
      <div className="rating">
        {[1, 2, 3, 4, 5].map((num) => (
          <span
            key={num}
            className={`star ${rating >= num ? "active" : ""}`}
            onClick={() => setRating(num)}
          >
            ★
          </span>
        ))}
      </div>
      <div className="like-buttons">
        <button
          className={`like-btn ${liked === true ? "active" : ""}`}
          onClick={() => setLiked(true)}
        >
          👍 Like
        </button>
        <button
          className={`dislike-btn ${liked === false ? "active" : ""}`}
          onClick={() => setLiked(false)}
        >
          👎 Dislike
        </button>
      </div>
      <button onClick={handleSubmit} className="submit-btn">
        Submit
      </button>
    </div>
  );
};

export default FeedbackForm;
