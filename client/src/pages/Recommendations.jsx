import { useState } from "react";
import { getRecommendations, getRecommendationExplanation } from "../api";
import ExplanationPanel from "../components/ExplanationPanel";
import "../styles/Recommendation.css";

export default function Recommendations() {
  const [email, setEmail] = useState("");
  const [movies, setMovies] = useState([]);
  const [explainOpen, setExplainOpen] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [loadingExplain, setLoadingExplain] = useState(false);

  const handleFetch = async () => {
    const res = await getRecommendations(email);
    const recs = res.data.recommendations || res.data;
    setMovies(recs);
  };

  const handleWhyThis = async (id) => {
    try {
      setLoadingExplain(true);
      const res = await getRecommendationExplanation(id, email, "movies");
      setExplanation(res.data);
      setExplainOpen(true);
    } catch (e) {
      console.error("Failed to fetch explanation", e);
      alert("Failed to load explanation.");
    } finally {
      setLoadingExplain(false);
    }
  };

  const renderHighlighted = (text, id) => {
    try {
      if (!text) return "";
      let safe = String(text).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
      if (!explanation || explanation.id !== id || !explanation?.explanation?.matched_item_terms?.length) return safe;
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
    <div className="page">
      <h2>Movie Recommendations</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleFetch}>Get Recommendations</button>

      <div className="movies-grid">
        {movies.map((m, idx) => (
          <div key={m.id || m.title || idx} className="movie-card">
            {m.poster_path ? (
              <img src={`https://image.tmdb.org/t/p/w200${m.poster_path}`} alt={m.title} />
            ) : (
              <img src={m.poster} alt={m.title} />
            )}
            <h4>{m.title}</h4>
            <p>{m.release_date || m.year}</p>
            {m.overview && (
              <p dangerouslySetInnerHTML={{ __html: renderHighlighted(m.overview, m.id) }} />
            )}
            <button className="why-this-btn" onClick={() => handleWhyThis(m.id)}>
              {loadingExplain ? "Loading..." : "Why this?"}
            </button>
          </div>
        ))}
      </div>

      {explainOpen && (
        <ExplanationPanel
          explanation={explanation?.explanation}
          onClose={() => setExplainOpen(false)}
        />
      )}
    </div>
  );
}
