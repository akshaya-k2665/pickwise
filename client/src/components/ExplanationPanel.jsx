// client/src/components/ExplanationPanel.jsx
// XAI UI: Panel to display per-recommendation explanations with contributions and terms.
import React from "react";

export default function ExplanationPanel({ explanation, compact = false, onClose }) {
  if (!explanation) return null;
  const { plain_text_reason, term_contributions = [], top_user_terms = [], matched_item_terms = [], score } = explanation;

  const pct = Math.max(0, Math.min(1, Number((score || 0)))) * 100;

  return (
    <div className={`explanation-overlay ${compact ? "compact" : ""}`}>
      <div className="explanation-panel">
        <div className="explanation-header">
          <h3>Why this?</h3>
          {onClose && (
            <button className="explanation-close" onClick={onClose} aria-label="Close explanation">✕</button>
          )}
        </div>

        <p className="explanation-reason">{plain_text_reason}</p>

        <div className="recommendation-explain-meter" aria-label="Match score">
          <div className="recommendation-explain-meter-fill" style={{ width: `${pct.toFixed(0)}%` }} />
        </div>
        <div className="recommendation-explain-score">Score: {(Number(score || 0)).toFixed(2)}</div>

        <div className="explanation-section">
          <h4>Top contributing preferences</h4>
          <div className="chip-row">
            {top_user_terms.map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
        </div>

        <div className="explanation-section">
          <h4>Matched item terms</h4>
          <div className="chip-row">
            {matched_item_terms.map((t) => (
              <span key={t} className="chip matched-term">{t}</span>
            ))}
          </div>
        </div>

        <div className="explanation-section">
          <h4>Contribution breakdown</h4>
          <div className="contrib-list">
            {term_contributions.slice(0, 8).map((c) => (
              <div key={c.term} className="contrib-item">
                <span className="contrib-term">{c.term}</span>
                <div className="contrib-bar">
                  <div className="contrib-bar-fill" style={{ width: `${Math.round((c.contribution || 0) * 100)}%` }} />
                </div>
                <span className="contrib-pct">{Math.round((c.contribution || 0) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
