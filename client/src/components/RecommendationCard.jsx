// src/components/RecommendationCard.jsx
import React, { useState, useEffect } from "react";
import "./RecommendationCard.css";
import API from "../api";

const RecommendationCard = ({ item, type }) => {
  const [liked, setLiked] = useState(null);
  const [review, setReview] = useState("");
  const [message, setMessage] = useState("");
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);

  // ✅ Safely get logged-in user info from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const userEmail = user?.email || localStorage.getItem("userEmail") || "guest";

  // ✅ Fetch all reviews for this item
  const fetchReviews = async () => {
    try {
      const { data } = await API.get(`/feedback/${item.id}/reviews`);
      setReviews(data);
    } catch (err) {
      console.error("❌ Error fetching reviews:", err.message);
    }
  };

  useEffect(() => {
    if (showReviews) fetchReviews();
  }, [showReviews]);

  // ✅ Handle like/dislike feedback
  const handleFeedback = async (isLiked) => {
    setLiked(isLiked);
    setMessage("");

    try {
      const payload = {
        userId: userEmail,
        contentId: item.id || item._id,
        type: item.title || type,
        feedback: isLiked ? "like" : "dislike",
        review: "", // optional
      };

      console.log("📤 Sending feedback:", payload); // debug log
      await API.post("/feedback", payload);
      setMessage(`✅ ${isLiked ? "Liked" : "Disliked"} successfully!`);
    } catch (error) {
      console.error("❌ Error sending feedback:", error.response?.data || error.message);
      setMessage("❌ Error submitting feedback");
    }
  };

  // ✅ Handle review submission
  const handleReviewSubmit = async () => {
    if (!review.trim()) {
      setMessage("⚠️ Please write a review before submitting.");
      return;
    }

    try {
      const payload = {
        userId: userEmail,
        contentId: item.id || item._id,
        type: item.title || type,
        feedback:
          liked === true
            ? "like"
            : liked === false
            ? "dislike"
            : "neutral",
        review: review.trim(),
      };

      console.log("📤 Submitting review:", payload); // debug log
      await API.post("/feedback", payload);
      setMessage("✅ Review submitted successfully!");
      setReview("");
      fetchReviews(); // refresh review list
    } catch (error) {
      console.error("❌ Error submitting review:", error.response?.data || error.message);
      setMessage("❌ Error submitting review");
    }
  };

  return (
    <div className="recommendation-card">
      {/* 🎬 Movies */}
      {type === "movie" && (
        <>
          <img src={item.poster} alt={item.title} className="poster" />
          <h3>{item.title}</h3>
          <p>{item.overview}</p>
          <p className="year">{item.year}</p>

          {/* Where to Watch */}
          {item.watchProviders && item.watchProviders.length > 0 && (
            <p className="watch-info">
              📺 <strong>Available on:</strong>{" "}
              {item.watchProviders.join(", ")}
            </p>
          )}

          {/* Like / Dislike */}
          <div className="feedback-buttons">
            <button
              className={`like-btn ${liked === true ? "active" : ""}`}
              onClick={() => handleFeedback(true)}
            >
              👍 Like
            </button>
            <button
              className={`dislike-btn ${liked === false ? "active" : ""}`}
              onClick={() => handleFeedback(false)}
            >
              👎 Dislike
            </button>
          </div>

          {/* Review input */}
          <textarea
            className="review-box"
            placeholder="Write your review..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          ></textarea>

          <button className="review-submit" onClick={handleReviewSubmit}>
            Submit Review
          </button>

          {message && <p className="feedback-message">{message}</p>}

          {/* Toggle Show/Hide Reviews */}
          <button
            className="toggle-reviews"
            onClick={() => setShowReviews(!showReviews)}
          >
            {showReviews ? "Hide Reviews" : "Show Reviews"}
          </button>

          {/* Reviews Section */}
          {showReviews && reviews.length > 0 && (
            <div className="reviews-section">
              <h4>User Reviews</h4>
              <ul>
                {reviews.map((r, index) => (
                  <li key={index}>
                    <p className="review-text">“{r.review}”</p>
                    <small className="review-meta">
                      👤 {r.userId || "Anonymous"} •{" "}
                      {r.feedback === "like"
                        ? "👍"
                        : r.feedback === "dislike"
                        ? "👎"
                        : "•"}{" "}
                      • {new Date(r.createdAt).toLocaleDateString()}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showReviews && reviews.length === 0 && (
            <p className="no-reviews">
              No reviews yet — be the first to write one!
            </p>
          )}
        </>
      )}

      {/* 📚 Books */}
      {type === "book" && (
        <>
          <img src={item.thumbnail} alt={item.title} className="poster" />
          <h3>{item.title}</h3>
          <p>{item.authors?.join(", ")}</p>
          <p>{item.publishedDate}</p>
        </>
      )}

      {/* 🎵 Music */}
      {type === "music" && (
        <>
          <img src={item.artwork} alt={item.title} className="poster" />
          <h3>{item.title}</h3>
          <p>{item.artist}</p>
          {item.previewUrl && (
            <audio controls>
              <source src={item.previewUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          )}
        </>
      )}
    </div>
  );
};

export default RecommendationCard;
