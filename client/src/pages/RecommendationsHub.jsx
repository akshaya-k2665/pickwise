import React, { useEffect, useState } from "react";
import { getRecommendations, getCrossDomainRecommendations, getRecommendationExplanation } from "../api";
import "../styles/Recommendation.css";
import ExplanationPanel from "../components/ExplanationPanel";

const RecommendationsHub = () => {
  const [movies, setMovies] = useState([]);
  const [music, setMusic] = useState([]);
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("personalized"); // "personalized" | "ai"
  const [explainOpen, setExplainOpen] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [explainedId, setExplainedId] = useState(null);
  const [explainedType, setExplainedType] = useState(null);
  const [loadingExplain, setLoadingExplain] = useState(false);

  const email = JSON.parse(localStorage.getItem("user"))?.email;

  // ===================== 🧠 Fetch Personalized Recommendations =====================
  const fetchPersonalized = async () => {
    try {
      setLoading(true);
      setMode("personalized");
      const [movieRes, musicRes, bookRes] = await Promise.all([
        getRecommendations(email, "movies"),
        getRecommendations(email, "music"),
        getRecommendations(email, "books"),
      ]);
      setMovies(movieRes.data?.recommendations || []);
      setMusic(musicRes.data?.recommendations || []);
      setBooks(bookRes.data?.recommendations || []);
    } catch (err) {
      console.error("❌ Error fetching personalized recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  // ===================== 🌍 Fetch Cross-Domain AI Recommendations =====================
  const fetchCrossDomain = async () => {
    if (!query.trim()) return alert("Please enter a theme or mood!");
    try {
      setLoading(true);
      setMode("ai");
      const res = await getCrossDomainRecommendations(email, { query });
      const data = res.data?.recommendations || {};
      setMovies(data.movies || []);
      setMusic(data.music || []);
      setBooks(data.books || []);
    } catch (err) {
      console.error("❌ Error fetching cross-domain recommendations:", err);
      alert("Something went wrong while fetching recommendations.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch personalized on first load
  useEffect(() => {
    if (email) fetchPersonalized();
  }, [email]);

  const onWhyThis = async (id, type) => {
    setExplainedId(id);
    setExplainedType(type);
    setLoadingExplain(true);
    try {
      const res = await getRecommendationExplanation(id, email, type);
      setExplanation(res.data);
      setExplainOpen(true);
    } catch (e) {
      console.warn("Single-item explanation failed; trying list-based fallback", e?.response?.data || e.message);
      // Fallback: fetch explain=true list and try to locate the item
      try {
        const listRes = await getRecommendations(email, { type, explain: true });
        const recs = listRes.data?.recommendations || [];
        let found = recs.find((r) => String(r.id) === String(id));
        if (!found) {
          // heuristic: match by title if id shapes differ
          const title = (movies.concat(music, books).find(x => x.id === id) || {}).title;
          if (title) found = recs.find((r) => r.title === title);
        }
        if (found?.explanation) {
          setExplanation({ id: found.id, score: found.score, explanation: found.explanation });
          setExplainOpen(true);
        } else {
          alert("Failed to load explanation.");
        }
      } catch (e2) {
        console.error("Fallback explanation also failed", e2?.response?.data || e2.message);
        alert("Failed to load explanation.");
      }
    } finally {
      setLoadingExplain(false);
    }
  };

  const renderHighlighted = (text, id, type) => {
    try {
      if (!text) return "";
      let safe = String(text).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
      if (explainedId !== id || !explanation?.explanation?.matched_item_terms?.length) return safe;
      const terms = explanation.explanation.matched_item_terms;
      terms.forEach((t) => {
        if (!t) return;
        const re = new RegExp(`(\\b${t.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b)`, "gi");
        safe = safe.replace(re, '<mark class="matched-term">$1</mark>');
      });
      return safe;
    } catch {
      return text;
    }
  };

  return (
    <div className="recommendations-hub">
      <h1>🤖 Smart Cross-Domain Recommendation Hub</h1>

      {/* 🔍 Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Try: romantic comedy, space adventure, chill mood..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={fetchCrossDomain} disabled={loading}>
          {loading ? "Loading..." : "Get AI Suggestions"}
        </button>
        <button onClick={fetchPersonalized} disabled={loading}>
          My Personalized
        </button>
      </div>

      {/* ℹ️ Info Section */}
      <p className="info-text">
        {mode === "ai"
          ? `💡 AI suggestions based on: "${query}"`
          : "✨ Personalized suggestions based on your saved preferences"}
      </p>

      {loading && (
        <div className="loading">
          <h2>Fetching recommendations...</h2>
        </div>
      )}

      {!loading && (
        <>
          {/* Movies Section */}
          <section>
            <h2>🎬 Movies</h2>
            <div className="recommendations-grid">
              {movies.length > 0 ? (
                movies.map((m, i) => (
                  <div key={i} className="recommendation-card">
                    <img src={m.poster} alt={m.title} />
                    <h3>{m.title}</h3>
                    <p dangerouslySetInnerHTML={{ __html: renderHighlighted(m.overview || "No description available.", m.id, "movies") }} />
                    {mode === "personalized" && (
                      <button
                        className="why-this-btn"
                        disabled={loadingExplain}
                        onClick={() => onWhyThis(m.id, "movies")}
                      >
                        {loadingExplain && explainedId === m.id ? "Loading..." : "Why this?"}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p>No movie recommendations found.</p>
              )}
            </div>
          </section>

          {/* Music Section */}
          <section>
            <h2>🎵 Music</h2>
            <div className="recommendations-grid">
              {music.length > 0 ? (
                music.map((s, i) => (
                  <div key={i} className="recommendation-card">
                    <img src={s.artwork} alt={s.title} />
                    <h3>{s.title}</h3>
                    <p>{s.artist}</p>
                    {s.previewUrl && (
                      <audio controls>
                        <source src={s.previewUrl} type="audio/mp3" />
                      </audio>
                    )}
                    {mode === "personalized" && (
                      <button
                        className="why-this-btn"
                        disabled={loadingExplain}
                        onClick={() => onWhyThis(s.id, "music")}
                      >
                        {loadingExplain && explainedId === s.id ? "Loading..." : "Why this?"}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p>No music recommendations found.</p>
              )}
            </div>
          </section>

          {/* Books Section */}
          <section>
            <h2>📚 Books</h2>
            <div className="recommendations-grid">
              {books.length > 0 ? (
                books.map((b, i) => (
                  <div key={i} className="recommendation-card">
                    <img src={b.thumbnail} alt={b.title} />
                    <h3>{b.title}</h3>
                    <p>{b.authors?.join(", ")}</p>
                    {mode === "personalized" && (
                      <button
                        className="why-this-btn"
                        disabled={loadingExplain}
                        onClick={() => onWhyThis(b.id, "books")}
                      >
                        {loadingExplain && explainedId === b.id ? "Loading..." : "Why this?"}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p>No book recommendations found.</p>
              )}
            </div>
          </section>
        </>
      )}
      {explainOpen && (
        <ExplanationPanel
          explanation={explanation?.explanation}
          onClose={() => setExplainOpen(false)}
        />
      )}
    </div>
  );
};

export default RecommendationsHub;
