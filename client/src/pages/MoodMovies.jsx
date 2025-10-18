/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import "../styles/Mood.css";

const providerLinks = {
  "Netflix": "https://www.netflix.com/",
  "Amazon Prime Video": "https://www.primevideo.com/",
  "Disney Plus Hotstar": "https://www.hotstar.com/",
  "Hulu": "https://www.hulu.com/",
  "Apple TV Plus": "https://tv.apple.com/",
  "Paramount Plus": "https://www.paramountplus.com/",
  "HBO Max": "https://www.max.com/",
  "Peacock": "https://www.peacocktv.com/",
  "Crunchyroll": "https://www.crunchyroll.com/",
  "Lionsgate Play": "https://www.lionsgateplay.com/",
  "SonyLIV": "https://www.sonyliv.com/",
  "ZEE5": "https://www.zee5.com/",
  "MX Player": "https://www.mxplayer.in/",
  "JioCinema": "https://www.jiocinema.com/",
};

export default function MoodMovies() {
  const { genre } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/mood/${genre}?t=${Date.now()}`);
      const data = await res.json();
      setMovies(data);
    } catch (err) {
      console.error("Error fetching movies:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [genre]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMovies();
  };

  return (
    <div className="mood-movies-container">
      <div className="mood-header">
        <h2 className="mood-title">🎬 {genre.toUpperCase()} MOVIES</h2>
        <button
          onClick={handleRefresh}
          className={`refresh-btn ${refreshing ? "refreshing" : ""}`}
          disabled={loading}
        >
          🔄 Refresh Recommendations
        </button>
      </div>

      {loading ? (
        <p className="loading-text">Loading your mood-based movies...</p>
      ) : (
        <div className="movie-grid">
          {movies.length === 0 ? (
            <p className="no-results">No movies found for this mood 😞</p>
          ) : (
            movies.map((movie) => (
              <div key={movie.id} className="movie-card">
                <img src={movie.poster} alt={movie.title} className="movie-poster large" />
                <div className="movie-info">
                  <h3>{movie.title}</h3>
                  <p>{movie.release_date?.slice(0, 4) || "N/A"}</p>
                  <p className="movie-rating">⭐ {movie.rating?.toFixed(1)}</p>

                  {movie.trailerUrl ? (
                    <a
                      href={movie.trailerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="trailer-btn"
                    >
                      🎞 Watch Trailer
                    </a>
                  ) : (
                    <p className="no-trailer">No trailer available</p>
                  )}

                  {movie.watch_providers?.length > 0 && (
                    <div className="watch-providers-list">
                      <p className="watch-text">📺 Watch on:</p>
                      {movie.watch_providers.map((p, idx) => {
                        const link =
                          providerLinks[p.name] ||
                          `https://www.google.com/search?q=${encodeURIComponent(
                            p.name + " streaming"
                          )}`;
                        return (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="watch-pill"
                          >
                            {p.name}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}