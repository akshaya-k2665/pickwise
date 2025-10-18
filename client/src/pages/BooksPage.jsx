import React, { useState, useEffect } from "react";
import { FaHeart, FaBook, FaSyncAlt } from "react-icons/fa";
import "../styles/BooksPage.css";
import { useNavigate } from "react-router-dom";

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [wishlist, setWishlist] = useState(
    JSON.parse(localStorage.getItem("wishlist_books") || "[]")
  );
  const genre = localStorage.getItem("bookGenre") || "fiction";
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Fetch books dynamically
  const fetchBooks = async () => {
    try {
      setIsLoading(true);

      // ✅ Corrected backticks for template string
      const res = await fetch(`http://localhost:5000/api/books?genre=${genre}`);
      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();
      console.log("📚 Book data:", data);

      if (data && Array.isArray(data.items)) {
        const cleanBooks = data.items.filter((b) => b.volumeInfo);
        // Randomly select 5 books from the fetched list
        const randomFive = cleanBooks.sort(() => 0.5 - Math.random()).slice(0, 5);
        setBooks(randomFive);
      } else {
        setBooks([]);
      }
    } catch (err) {
      console.error("❌ Error fetching books:", err);
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [genre]);

  // ✅ Wishlist toggle
  const toggleWishlist = (book) => {
    const updated = wishlist.some((b) => b.id === book.id)
      ? wishlist.filter((b) => b.id !== book.id)
      : [...wishlist, book];
    setWishlist(updated);
    localStorage.setItem("wishlist_books", JSON.stringify(updated));
  };

  const isInWishlist = (bookId) => wishlist.some((b) => b.id === bookId);

  return (
    <div className="books-page-container">
      <h1 className="page-heading">
        <FaBook className="book-icon" /> Recommended{" "}
        {genre.charAt(0).toUpperCase() + genre.slice(1)} Books
      </h1>

      {/* 🔄 Refresh Button */}
      <div className="refresh-section">
        <button
          onClick={fetchBooks}
          disabled={isLoading}
          className="refresh-btn"
        >
          <FaSyncAlt className={isLoading ? "spin" : ""} />{" "}
          {isLoading ? "Refreshing..." : "Refresh Recommendations"}
        </button>
      </div>

      {/* 📚 Books List */}
      {books.length === 0 && !isLoading ? (
        <p className="no-books">
          No books found for this genre. Try another one!
        </p>
      ) : (
        <div className="books-grid">
          {books.map((book) => {
            const info = book.volumeInfo || {};
            const thumbnail =
              info.imageLinks?.thumbnail ||
              "https://books.google.com/googlebooks/images/no_cover_thumb.gif";

            return (
              <div key={book.id} className="book-card">
                <img
                  src={thumbnail}
                  alt={info.title || "Book"}
                  className="book-cover"
                />
                <h3>{info.title || "Untitled"}</h3>
                <p className="author">
                  {info.authors?.join(", ") || "Unknown Author"}
                </p>
                <p className="desc">
                  {info.description
                    ? info.description.slice(0, 100) + "..."
                    : "No description available."}
                </p>

                {/* ❤️ Wishlist Button */}
                <button
                  className={`heart-btn ${
                    isInWishlist(book.id) ? "active" : ""
                  }`}
                  onClick={() => toggleWishlist(book)}
                  title={
                    isInWishlist(book.id)
                      ? "Remove from Wishlist"
                      : "Add to Wishlist"
                  }
                >
                  <FaHeart />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BooksPage;
