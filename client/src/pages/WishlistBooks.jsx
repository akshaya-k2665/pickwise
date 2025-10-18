import React, { useState } from "react";
import { FaHeart, FaTrash } from "react-icons/fa";
import "../styles/WishlistBooks.css";

const WishlistBooks = () => {
  const [wishlist, setWishlist] = useState(
    JSON.parse(localStorage.getItem("wishlist_books") || "[]")
  );

  const removeFromWishlist = (bookId) => {
    const updated = wishlist.filter((b) => b.id !== bookId);
    setWishlist(updated);
    localStorage.setItem("wishlist_books", JSON.stringify(updated));
  };

  return (
    <div className="wishlist-page-container">
      <h1 className="wishlist-heading">
        <FaHeart className="heart-icon" /> Your Book Wishlist
      </h1>

      {wishlist.length === 0 ? (
        <p className="empty-text">Your wishlist is empty ❤️</p>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((book) => {
            const info = book.volumeInfo;
            return (
              <div key={book.id} className="wishlist-card">
                <img
                  src={info.imageLinks?.thumbnail || "/placeholder.png"}
                  alt={info.title}
                  className="wishlist-cover"
                />
                <div className="wishlist-info">
                  <h3>{info.title}</h3>
                  <p className="author">{info.authors?.join(", ")}</p>
                  <button
                    className="remove-btn"
                    onClick={() => removeFromWishlist(book.id)}
                  >
                    <FaTrash /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistBooks;
