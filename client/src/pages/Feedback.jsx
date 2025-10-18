import { useState } from "react";
import { submitFeedback } from "../api";
import "../styles/Feedback.css"; // optional for stars styling

export default function Feedback() {
  const [form, setForm] = useState({
    email: "",
    feedback: "",
    contentId: "",
    type: "movie", // default type
    rating: 0,
    liked: null,
  });
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Build payload for backend
      const payload = {
        userId: form.email || "guest@example.com", // temporary if no login system
        contentId: form.contentId || "general-feedback",
        type: form.type,
        feedback: form.liked === true ? "like" : form.liked === false ? "dislike" : form.feedback,
        rating: form.rating || undefined,
      };

      await submitFeedback(payload);
      setMsg("✅ Feedback submitted successfully!");
      setForm({ email: "", feedback: "", contentId: "", type: "movie", rating: 0, liked: null });
    } catch (error) {
      console.error("❌ Error submitting feedback:", error);
      setMsg("❌ Error submitting feedback");
    }
  };

  return (
    <div className="page feedback-page">
      <h2>Share Your Feedback</h2>

      <form onSubmit={handleSubmit}>
        {/* User Email */}
        <input
          type="email"
          placeholder="Your Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        {/* Feedback Text */}
        <textarea
          placeholder="Your feedback or suggestions..."
          value={form.feedback}
          onChange={(e) => setForm({ ...form, feedback: e.target.value })}
        ></textarea>

        {/* Optional Rating (1–5 stars) */}
        <div className="rating-section">
          <label>Rate us:</label>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((num) => (
              <span
                key={num}
                className={`star ${form.rating >= num ? "active" : ""}`}
                onClick={() => setForm({ ...form, rating: num })}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* Like / Dislike */}
        <div className="like-dislike">
          <label>Your reaction:</label>
          <div className="buttons">
            <button
              type="button"
              className={`like-btn ${form.liked === true ? "active" : ""}`}
              onClick={() => setForm({ ...form, liked: true })}
            >
              👍 Like
            </button>
            <button
              type="button"
              className={`dislike-btn ${form.liked === false ? "active" : ""}`}
              onClick={() => setForm({ ...form, liked: false })}
            >
              👎 Dislike
            </button>
          </div>
        </div>

        <button type="submit" className="submit-btn">
          Submit Feedback
        </button>
      </form>

      {msg && <p className="message">{msg}</p>}
    </div>
  );
}
