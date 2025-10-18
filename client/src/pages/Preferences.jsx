import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveMoviePreferences as savePreferences,
  getMoviePreferences as getPreferences,
} from "../api";
import "../styles/Preferences.css";
import { toast, Toaster } from "react-hot-toast";

export default function Preferences() {
  const [genres, setGenres] = useState([]);
  const [era, setEra] = useState("");
  const [favorites, setFavorites] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const genreList = [
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Romance",
    "Thriller",
    "Sci-Fi",
    "Fantasy",
    "Animation",
  ];

  // ✅ Toggle genre selection
  const toggleGenre = (g) => {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  // ✅ Load existing preferences when component mounts
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const email = storedUser ? JSON.parse(storedUser).email : null;

    if (!email) return;

    getPreferences(email)
      .then(({ data }) => {
        const prefs = data?.data || {};
        setGenres(prefs.genres || []);
        setEra(prefs.era || "");
        setFavorites((prefs.favorites || []).join(", "));
      })
      .catch(() => {
        console.log("ℹ️ No preferences found, showing empty form.");
      });
  }, []);

  // ✅ Save preferences
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const storedUser = localStorage.getItem("user");
    const email = storedUser ? JSON.parse(storedUser).email : null;

    if (!email) {
      toast.error("No user email found. Please log in again.");
      setLoading(false);
      return;
    }

    const userPrefs = {
      genres,
      era,
      favorites: favorites
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
    };

    try {
      console.log("📧 Sending Preferences:", email, userPrefs);

      const res = await savePreferences(email, userPrefs);

      if (res.success) {
        localStorage.setItem(`preferences_${email}`, JSON.stringify(userPrefs));
        toast.success("✅ Preferences saved successfully!");
        setTimeout(() => navigate("/home"), 1500);
      } else {
        toast.error(res.message || "Failed to save preferences.");
      }
    } catch (err) {
      console.error("❌ Error saving preferences:", err.response?.data || err.message);
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="preferences-container">
      <Toaster position="top-center" reverseOrder={false} />

      <form className="preferences-card" onSubmit={handleSubmit}>
        <h2>🎬 Movie Preferences</h2>

        {/* GENRES */}
        <h3>1️⃣ Select your favorite genres</h3>
        <div className="genre-list">
          {genreList.map((g) => (
            <div
              key={g}
              className={`genre-item ${genres.includes(g) ? "selected" : ""}`}
              onClick={() => toggleGenre(g)}
            >
              {g}
            </div>
          ))}
        </div>

        {/* ERA */}
        <h3>2️⃣ What kind of movies do you prefer?</h3>
        <select value={era} onChange={(e) => setEra(e.target.value)} required>
          <option value="">-- Select Era --</option>
          <option value="Recent">✨ Recent (After 2015)</option>
          <option value="Classic">🎥 Classic (Before 2015)</option>
          <option value="Both">🎬 Both</option>
        </select>

        {/* FAVORITES */}
        <h3>3️⃣ Name 2–3 of your favorite movies</h3>
        <textarea
          placeholder="Type your favorite movies (comma-separated)..."
          value={favorites}
          onChange={(e) => setFavorites(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Continue →"}
        </button>
      </form>
    </div>
  );
}
