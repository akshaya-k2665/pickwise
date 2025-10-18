import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/BookPreferences.css";
import { FaHeart, FaBookOpen } from "react-icons/fa";

const BookPreferences = () => {
  const navigate = useNavigate();
  const [genre, setGenre] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!genre) return alert("Please select a genre");
    localStorage.setItem("bookGenre", genre);
    navigate("/books");
  };

  return (
    <div className="book-preferences-container">
      <h1 className="page-title">
        <FaBookOpen className="icon" /> Choose Your Book Preferences
      </h1>

      <div className="book-options-grid">
        {/* Genre Selection Card */}
        <div className="option-card">
          <h2>Select by Genre</h2>
          <form onSubmit={handleSubmit}>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="genre-select"
            >
              <option value="">Select a genre</option>
              <option value="fiction">Fiction</option>
              <option value="romance">Romance</option>
              <option value="fantasy">Fantasy</option>
              <option value="mystery">Mystery</option>
              <option value="science">Science</option>
              <option value="history">History</option>
            </select>
            <button type="submit" className="recommend-btn">
              Get Recommendations
            </button>
          </form>
        </div>

        {/* Wishlist Card */}
        <div
          className="option-card wishlist-card"
          onClick={() => navigate("/books/wishlist")}
        >
          <h2>
            <FaHeart className="heart-icon" /> Your Wishlist
          </h2>
          <p>View your saved books and revisit your favorites anytime.</p>
        </div>
      </div>
    </div>
  );
};

export default BookPreferences;
