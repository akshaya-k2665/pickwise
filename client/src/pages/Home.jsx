import { useEffect, useState } from "react";
import "../styles/Home.css";
import API, { getRecommendations, getPreferences } from "../api";
import RecommendationCard from "../components/RecommendationCard"; // ✅ import the card

function Home() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(getMessage());
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const email = storedUser ? JSON.parse(storedUser).email : null;

    if (!email) {
      console.error("⚠️ No email found in localStorage.");
      setLoading(false);
      return;
    }

    // ✅ Load preferences (localStorage → backend fallback)
    const localPrefs = localStorage.getItem(`preferences_${email}`);
    if (localPrefs) {
      setPreferences(JSON.parse(localPrefs));
    } else {
      getPreferences(email)
        .then(({ data }) => {
          const prefs = data?.data || data;
          if (prefs) {
            setPreferences(prefs);
            localStorage.setItem(`preferences_${email}`, JSON.stringify(prefs));
          }
        })
        .catch(() => console.warn("⚠️ No preferences found in backend."));
    }

    // ✅ Fetch movie recommendations
    const fetchHistory = () => {
      API.get(`/recommendations/${email}/history`)
        .then(({ data }) => {
          const latest = data?.history?.[0]?.movies || [];
          setRecommendations(formatMovies(latest));
          setLoading(false);
        })
        .catch((err) => {
          console.error("❌ Error fetching history:", err);
          setRecommendations([]);
          setLoading(false);
        });
    };

    getRecommendations(email)
      .then(({ data }) => {
        const list = data.recommendations || data || [];
        if (!list || list.length === 0) {
          fetchHistory();
        } else {
          setRecommendations(formatMovies(list));
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("❌ Error fetching fresh recs:", err);
        fetchHistory();
      });

    // ✅ Update greeting message every minute
    const interval = setInterval(() => setMessage(getMessage()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-container">
      <div className="hero">
        <h1>
          <span className="glow">{message}</span>
          <br />
          <span className="highlight">Let's Discover</span>
        </h1>
        <p>
          Your personal AI discovers amazing movies tailored to your unique
          taste and preferences.
        </p>

        {/* ✅ Safe display of preferences */}
        {preferences && (
          <p style={{ marginTop: "1rem", fontStyle: "italic" }}>
            🎯 Based on your preferences:{" "}
            {preferences.genres?.length
              ? preferences.genres.join(", ")
              : "No genres"}{" "}
            | {preferences.era || "No era selected"} | Favorites:{" "}
            {Array.isArray(preferences.favorites)
              ? preferences.favorites.join(", ")
              : preferences.favorites || "None"}
          </p>
        )}

        <div className="button-row">
          <button
            className="primary-button"
            onClick={() => window.location.reload()}
          >
            🔄 Refresh Recommendations
          </button>
        </div>
      </div>

      {/* 🎬 Movie Recommendations */}
      <div className="carousel">
        <h2 className="carousel-heading">Your Top Picks</h2>
        {loading ? (
          <p>⏳ Loading recommendations...</p>
        ) : recommendations.length > 0 ? (
          <div className="cards-scroll">
            {recommendations.map((movie, index) => (
              <RecommendationCard
                key={movie.id || movie._id || index}
                item={{
                  id: movie.id || movie._id || index,
                  title: movie.title,
                  overview: movie.overview,
                  poster: movie.poster,
                  year: movie.releaseDate,
                  watchProviders: movie.watchProviders || [
                    "Netflix",
                    "Amazon Prime",
                  ],
                }}
                type="movie" // ✅ Enables like/dislike + review UI
              />
            ))}
          </div>
        ) : (
          <p>😔 No recommendations found. Please set your preferences.</p>
        )}
      </div>
    </div>
  );
}

// ✅ Helper — format movie list safely
function formatMovies(list) {
  return list.map((movie, index) => ({
    id: movie.id || movie._id || index,
    title: movie.title,
    overview: movie.overview || "No description available.",
    poster:
      movie.poster && movie.poster !== "N/A"
        ? movie.poster
        : "/placeholder.png",
    releaseDate: movie.year || "Unknown",
    rating: movie.genres ? movie.genres.join(", ") : "N/A",
    watchProviders: movie.watchProviders || ["Netflix", "Amazon Prime"],
  }));
}

// ✅ Helper — dynamic greeting message
function getMessage() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "☀️ Start your day with an amazing movie!";
  if (hour >= 12 && hour < 17) return "🌟 Take a break, enjoy a great film!";
  if (hour >= 17 && hour < 21) return "🎬 Perfect evening for a blockbuster!";
  return "🌙 Relax with a late-night classic!";
}

export default Home;
