// server/services/aiRecommenderService.js
// XAI additions: explanation generation and global feature importances with light caching.
const { cosineSimilarity } = require("../utils/mathUtils");

let embeddingPipelinePromise = null;
async function getLocalEmbedder() {
  if (!embeddingPipelinePromise) {
    const { pipeline } = await import("@xenova/transformers");
    embeddingPipelinePromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embeddingPipelinePromise;
}

// In-memory cache for embeddings to avoid recomputation across requests
const embeddingCache = new Map(); // key: text string, value: embedding array

const STOPWORDS = new Set([
  "the","a","an","and","or","of","in","on","for","to","with","by","at","from","is","are","was","were","it","this","that","as","be","about","into","over","under","after","before","between","through","your","you","we","our","their","his","her"
]);

function normalizeText(s = "") {
  return String(s || "").toLowerCase();
}

function tokenizeText(text = "") {
  const tokens = normalizeText(text)
    .split(/[^a-z0-9\-\_]+/i)
    .filter(Boolean)
    .filter((t) => !STOPWORDS.has(t) && t.length > 2);
  return tokens;
}

async function getEmbedding(text) {
  const key = `emb:${text}`;
  if (embeddingCache.has(key)) return embeddingCache.get(key);
  const extractor = await getLocalEmbedder();
  const output = await extractor(text || "", { pooling: "mean", normalize: true });
  const emb = Array.from(output.data);
  embeddingCache.set(key, emb);
  return emb;
}

// Existing baseline scorer (kept for backward compatibility)
async function getAIRecommendations(userPreferences, items, type) {
  // Build a consolidated user text from preferences object shape {genres:[], favorites:[]}
  const prefs = userPreferences?.[type] || userPreferences || {};
  const userTerms = [
    ...(Array.isArray(prefs.genres) ? prefs.genres : []),
    ...(Array.isArray(prefs.favorites) ? prefs.favorites : []),
  ].filter(Boolean);
  const userText = userTerms.join(", ") || "";
  const userVector = await getEmbedding(userText);

  const scoredItems = await Promise.all(
    items.map(async (item) => {
      const text =
        type === "movies"
          ? `${item.title} ${item.overview || ""}`
          : type === "music"
          ? `${item.title} ${item.artist || ""} ${item.genre || ""}`
          : `${item.title} ${item.description || ""} ${(item.categories || []).join(" ")} ${(item.authors || []).join(" ")}`;
      const itemVector = await getEmbedding(text);
      const score = cosineSimilarity(userVector, itemVector);
      return { ...item, score };
    })
  );

  return scoredItems.sort((a, b) => b.score - a.score).slice(0, 10);
}

// Approximate per-term contribution for embeddings-based scoring.
// We compute embeddings for user phrases and item tokens separately and estimate
// contribution via cosine(user_term_vector, item_vector). This is an approximation
// because the recommender uses aggregated embeddings; per-term influence is estimated
// rather than exactly decomposed (LIME/SHAP can be added later for model-based XAI).
async function getAIRecommendationsWithExplanations(userPreferences, items, type) {
  try {
    const prefs = userPreferences?.[type] || userPreferences || {};
    const userTerms = [
      ...(Array.isArray(prefs.genres) ? prefs.genres : []),
      ...(Array.isArray(prefs.favorites) ? prefs.favorites : []),
    ]
      .map((t) => t.trim())
      .filter(Boolean);

    const userText = userTerms.join(", ") || "";
    const userVector = await getEmbedding(userText || "");
    const userTermVecs = await Promise.all(
      userTerms.map((t) => getEmbedding(t))
    );

    const enriched = await Promise.all(
      items.map(async (item) => {
        const itemText =
          type === "movies"
            ? `${item.title} ${item.overview || ""}`
            : type === "music"
            ? `${item.title} ${item.artist || ""} ${item.genre || ""}`
            : `${item.title} ${item.description || ""} ${(item.categories || []).join(" ")} ${(item.authors || []).join(" ")}`;

        // Item vector and base score
        const itemVector = await getEmbedding(itemText);
        const score = cosineSimilarity(userVector, itemVector);

        // Per-user-term contributions vs item vector
        const termContribRaw = userTermVecs.map((v, i) => ({
          term: userTerms[i],
          contribution: cosineSimilarity(v, itemVector),
        }));
        const posSum = termContribRaw
          .map((x) => (x.contribution > 0 ? x.contribution : 0))
          .reduce((a, b) => a + b, 0) || 1;
        const term_contributions = termContribRaw
          .map((x) => ({
            term: x.term,
            user_term_weight: 1,
            item_term_weight: 1,
            contribution_score: x.contribution,
            contribution: Math.max(0, x.contribution) / posSum,
          }))
          .sort((a, b) => b.contribution - a.contribution)
          .slice(0, 8);

        const top_user_terms = term_contributions.slice(0, 5).map((x) => x.term);

        // Find matched item terms by tokenizing and scoring similarity to any user term vector
        const tokens = Array.from(new Set(tokenizeText(itemText))).slice(0, 50);
        const tokenVecs = await Promise.all(tokens.map((t) => getEmbedding(t)));
        const tokenScores = tokens.map((tok, i) => {
          const v = tokenVecs[i];
          const best = userTermVecs.reduce(
            (m, u) => Math.max(m, cosineSimilarity(u, v)),
            -Infinity
          );
          return { term: tok, score: best };
        });
        const matched_item_terms = tokenScores
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((x) => x.term);

        const plain_text_reason = buildPlainTextReason({
          score,
          top_user_terms,
          matched_item_terms,
          itemTitle: item.title,
          type,
        });

        return {
          ...item,
          score,
          explanation: {
            partial: false,
            score,
            top_user_terms,
            matched_item_terms,
            term_contributions,
            plain_text_reason,
          },
        };
      })
    );

    return enriched.sort((a, b) => b.score - a.score).slice(0, 10);
  } catch (err) {
    // Fallback best-effort explanation if embeddings fail (e.g., quota)
    console.error("XAI fallback (embeddings failed):", err.message);
    return items.map((item) => ({
      ...item,
      score: 0,
      explanation: {
        partial: true,
        score: 0,
        top_user_terms: [],
        matched_item_terms: [],
        term_contributions: [],
        plain_text_reason:
          "We could not compute detailed term-level contributions due to a temporary AI service issue. Displaying basic recommendation without breakdown.",
      },
    }));
  }
}

function buildPlainTextReason({ score, top_user_terms, matched_item_terms, itemTitle, type }) {
  const s = (score || 0).toFixed(2);
  const u = top_user_terms.slice(0, 2).join(" and ") || "your interests";
  const m = matched_item_terms.slice(0, 3).join(", ") || "key themes";
  const noun = type === "music" ? "track" : type === "books" ? "book" : "movie";
  return `This ${noun} scored ${s} for you because your interest in ${u} matches ${itemTitle}'s description featuring ${m}. These signals align strongly with your preferences.`;
}

// Compute simple TF-IDF (or TF if minimal) to return top global terms per type
async function getGlobalFeatureImportances(items, type, topN = 20) {
  // If caller doesn't provide items, use small built-in corpora to avoid external calls
  const corpora = {
    movies: [
      "epic space opera with galactic battles and interstellar travel",
      "gritty crime drama set in urban streets with complex characters",
      "heartwarming family adventure with friendship and discovery",
    ],
    music: [
      "upbeat pop anthem with synthwave vibes and catchy chorus",
      "mellow acoustic ballad with soulful vocals and intimate lyrics",
      "energetic hip hop track with hard-hitting beats and flow",
    ],
    books: [
      "epic fantasy saga featuring magic kingdoms and ancient prophecies",
      "thought-provoking dystopian novel with political intrigue",
      "inspiring self-help guide focused on habits and growth",
    ],
  };

  const docs = (items && Array.isArray(items) && items.length
    ? items.map((it) =>
        type === "movies"
          ? `${it.title} ${it.overview || ""}`
          : type === "music"
          ? `${it.title} ${it.artist || ""} ${it.genre || ""}`
          : `${it.title} ${it.description || ""} ${(it.categories || []).join(" ")} ${(it.authors || []).join(" ")}`
      )
    : corpora[type] || corpora["movies"]).map((t) => normalizeText(t));

  const docTokens = docs.map((d) => tokenizeText(d));
  const df = new Map();
  docTokens.forEach((toks) => {
    const seen = new Set();
    toks.forEach((t) => {
      if (!seen.has(t)) {
        df.set(t, (df.get(t) || 0) + 1);
        seen.add(t);
      }
    });
  });
  const N = docs.length || 1;
  const tfidf = new Map();
  docTokens.forEach((toks) => {
    const tf = new Map();
    toks.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
    tf.forEach((tfv, t) => {
      const idf = Math.log((N + 1) / ((df.get(t) || 1) + 1)) + 1; // smoothed idf
      const v = (tfv / toks.length) * idf;
      tfidf.set(t, (tfidf.get(t) || 0) + v);
    });
  });

  const top = Array.from(tfidf.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([term, score]) => ({ term, score: Number(score.toFixed(4)) }));

  const summary = `Top signals we use to recommend ${type}: ${top
    .slice(0, 6)
    .map((t) => t.term)
    .join(", ")}.`;

  return { type, top_terms: top, summary };
}

module.exports = {
  getEmbedding,
  getAIRecommendations,
  getAIRecommendationsWithExplanations,
  getGlobalFeatureImportances,
};
