const express = require("express");
const axios = require("axios");
const router = express.Router();

const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes";

router.get("/", async (req, res) => {
  try {
    const { genre = "fiction", q } = req.query;
    const key = process.env.GOOGLE_BOOKS_API_KEY;

    // ✅ Check for API key
    if (!key) {
      console.error("❌ BOOKS_API_KEY missing in .env");
      return res.status(500).json({
        error: "Missing Google Books API key in server environment (.env).",
      });
    }

    // ✅ Validate query or genre
    if (!q && !genre) {
      console.error("❌ Missing both 'q' and 'genre' in query");
      return res.status(400).json({
        error: "Missing 'q' (search term) or 'genre' parameter.",
      });
    }

    const query = q ? q : `subject:${genre}`;
    const url = `${GOOGLE_BOOKS_URL}?q=${encodeURIComponent(
      query
    )}&printType=books&maxResults=20&key=${key}`;

    // ✅ Log the full URL for debugging
    console.log("📘 Fetching from Google Books API:", url);

    const response = await axios.get(url);

    // ✅ If no results found
    if (!response.data.items || response.data.items.length === 0) {
      console.warn("⚠️ No books found for query:", query);
      return res.status(404).json({ message: "No books found for this genre." });
    }

    // ✅ Success
    res.json(response.data);
  } catch (error) {
    // ✅ Detailed error logging
    console.error("❌ Books API Error:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Message:", error.message);
    }

    res.status(500).json({
      error: "Failed to fetch books from Google Books API.",
      details: error.response?.data?.error?.message || error.message,
    });
  }
});

module.exports = router;
