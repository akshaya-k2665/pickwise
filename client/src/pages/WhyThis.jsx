import React, { useEffect, useState } from 'react';
import { getGlobalExplanations } from '../api';
import '../styles/Recommendation.css';

export default function WhyThis() {
  const [type, setType] = useState('movies');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchGlobal = async (t) => {
    try {
      setLoading(true);
      setError('');
      const res = await getGlobalExplanations(t);
      setData(res.data);
    } catch (e) {
      console.error('Failed to load global explanations', e);
      setError('Failed to load global explanations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobal(type);
  }, [type]);

  return (
    <div className="page-container">
      <h1>Why This?</h1>
      <p>Top signals we use to recommend content. Switch domains to see term importances.</p>

      <div className="whythis-controls">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="movies">Movies</option>
          <option value="music">Music</option>
          <option value="books">Books</option>
        </select>
      </div>

      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error-text">{error}</div>}

      {data && (
        <div className="global-explain">
          <p className="info-text">{data.summary}</p>
          <div className="terms-cloud">
            {data.top_terms?.slice(0, 20).map((t) => (
              <span key={t.term} className="chip" title={`score: ${t.score}`}>{t.term}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
