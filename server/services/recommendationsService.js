// ===============================================================
// 📦 Imports & Setup
// ===============================================================
const axios = require("axios");
const User = require("../models/User");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ===============================================================
// 🕐 Timeout Helper
// ===============================================================
async function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
  ]);
}

// ===============================================================
// 🎬 MOVIE DETAILS
// ===============================================================
async function getMovieDetails(title) {
  try {
    const res = await withTimeout(
      axios.get("http://www.omdbapi.com/", {
        params: { apikey: process.env.OMDB_API_KEY, t: title },
      }),
      8000
    );
    const d = res.data;
    if (d.Response === "False") return null;
    return {
      title: d.Title,
      year: d.Year,
      poster: d.Poster,
      genres: d.Genre ? d.Genre.split(", ") : [],
      overview: d.Plot || "No description available.",
      imdbRating: d.imdbRating || "N/A",
    };
  } catch (err) {
    console.error("🎬 OMDb Error:", err.message);
    return null;
  }
}

// ===============================================================
// 📚 BOOK DETAILS
// ===============================================================
async function getBookDetails(title) {
  try {
    const res = await withTimeout(
      axios.get("https://www.googleapis.com/books/v1/volumes", {
        params: { q: title, key: process.env.GOOGLE_BOOKS_API_KEY },
      }),
      8000
    );
    const item = res.data.items?.[0];
    if (!item) return null;
    const info = item.volumeInfo;
    return {
      title: info.title || title,
      authors: info.authors || ["Unknown Author"],
      description: info.description || "No description available.",
      thumbnail: info.imageLinks?.thumbnail || "",
      categories: info.categories || [],
      publishedDate: info.publishedDate || "N/A",
      infoLink: info.infoLink || "",
    };
  } catch (err) {
    console.error("📚 Google Books Error:", err.message);
    return null;
  }
}

// ===============================================================
// 🎵 MUSIC DETAILS
// ===============================================================
async function getMusicDetails(term) {
  try {
    const res = await withTimeout(
      axios.get("https://itunes.apple.com/search", {
        params: { term, media: "music", limit: 1 },
      }),
      8000
    );
    const item = res.data.results?.[0];
    if (!item) return null;
    return {
      title: item.trackName || term,
      artist: item.artistName || "Unknown Artist",
      album: item.collectionName || "Unknown Album",
      artwork: item.artworkUrl100 || "",
      previewUrl: item.previewUrl || "",
      releaseDate: item.releaseDate?.split("T")[0] || "N/A",
      genre: item.primaryGenreName || "N/A",
      iTunesUrl: item.trackViewUrl || "",
    };
  } catch (err) {
    console.error("🎵 iTunes Error:", err.message);
    return null;
  }
}

// ===============================================================
// 🎯  Single-Domain Recommendations
// ===============================================================
exports.getRecommendations = async (email, type = "movies") => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    type = type.toLowerCase();
    const singularType = type.endsWith("s") ? type.slice(0, -1) : type;
    const prefs = user.preferences?.[type] || {};

    const genres = (prefs.genres || []).join(", ") || "any genre";
    const favorites = (prefs.favorites || []).join(", ") || "none";

    const prompt = `
Suggest 5 ${singularType === "book" ? "books" : singularType === "music" ? "songs or artists" : "movies"} 
based on:
Genres: ${genres}
Favorites: ${favorites}
Return plain names, one per line.
`;

    let model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    let result;
    try {
      result = await withTimeout(model.generateContent(prompt), 15000);
    } catch {
      model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      result = await withTimeout(model.generateContent(prompt), 15000);
    }

    const names =
      result?.response
        ?.text?.()
        ?.split(/\r?\n/)
        .map((x) => x.replace(/^[\-\*\d\.\)\s"]+|["]+$/g, "").trim())
        .filter(Boolean) || [];

    const fallback = {
      movie: ["Inception", "Interstellar", "Titanic"],
      book: ["Harry Potter", "The Hobbit", "1984"],
      music: ["Blinding Lights", "Shape of You", "Bohemian Rhapsody"],
    }[singularType];

    const items = names.length ? names : fallback;

    const detailPromises = items.map((n) =>
      singularType === "book"
        ? getBookDetails(n)
        : singularType === "music"
        ? getMusicDetails(n)
        : getMovieDetails(n)
    );
    const details = (await Promise.all(detailPromises)).filter(Boolean);

    return details.length ? details : fallback.map((title) => ({ title }));
  } catch (err) {
    console.error("❌ Recommendation Error:", err.message);
    return [];
  }
};

// ===============================================================
// 🌍  Cross-Domain Recommendations
// ===============================================================
exports.getCrossDomainRecommendations = async (email, query = "romantic adventure") => {
  try {
    console.log(`🌍 Generating cross-domain recs for: "${query}"`);

    const prompt = `
User Query: "${query}"
Suggest related recommendations:
Movies:
- ...
Music:
- ...
Books:
- ...
Ensure 3 for each and only plain text lists.
`;

    let model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    let result;
    try {
      result = await withTimeout(model.generateContent(prompt), 20000);
    } catch {
      model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      result = await withTimeout(model.generateContent(prompt), 20000);
    }

    const text = result?.response?.text?.() || "";
    console.log("🧠 Gemini Raw Cross Output:\n", text);

    // Split into sections robustly
    const extract = (section) =>
      text
        .split(new RegExp(`${section}:`, "i"))[1]
        ?.split(/\n(?=[A-Z])/)[0]
        ?.split(/\r?\n/)
        ?.map((x) => x.replace(/^[\-\*\d\.\)\s"]+|["]+$/g, "").trim())
        .filter(Boolean) || [];

    const movies = extract("Movies");
    const music = extract("Music");
    const books = extract("Books");

    const movieDetails = (await Promise.all(movies.map(getMovieDetails))).filter(Boolean);
    const musicDetails = (await Promise.all(music.map(getMusicDetails))).filter(Boolean);
    const bookDetails = (await Promise.all(books.map(getBookDetails))).filter(Boolean);

    return {
      baseQuery: query,
      recommendations: {
        movies: movieDetails,
        music: musicDetails,
        books: bookDetails,
      },
    };
  } catch (err) {
    console.error("❌ Cross-Domain Error:", err.message);
    return { baseQuery: query, recommendations: { movies: [], music: [], books: [] } };
  }
};
