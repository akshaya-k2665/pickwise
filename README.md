# Project P6

## Explainable AI (XAI)
This release adds backend explainability for the embeddings-based recommender and frontend UI to visualize explanations.

### New/updated endpoints
- GET `/api/recommendations?email=<email>&explain=true&type=movies`
  - Returns recommendations plus `explanation` object per item.
- GET `/api/recommendations/:id/explain?email=<email>&type=movies`
  - Returns explanation for a single recommended item.
- GET `/api/recommendations/global-explain?type=movies`
  - Returns global feature importances (TF‑IDF) for the specified domain.

All existing endpoints continue to work without `explain=true`.

### Response example (`?explain=true`)
```json
{
  "recommendations": [
    {
      "id": "movies-star-odyssey",
      "title": "Star Odyssey",
      "score": 0.82,
      "explanation": {
        "partial": false,
        "score": 0.82,
        "plain_text_reason": "This movie scored 0.82 for you because your interest in space opera and epic worldbuilding matches Star Odyssey's description featuring space, galactic, epic. These signals align strongly with your preferences.",
        "top_user_terms": ["space opera", "epic worldbuilding", "sci-fi"],
        "matched_item_terms": ["space", "galactic", "epic"],
        "term_contributions": [
          {"term":"space opera","user_term_weight":1,"item_term_weight":1,"contribution_score":0.45,"contribution":0.45},
          {"term":"epic worldbuilding","user_term_weight":1,"item_term_weight":1,"contribution_score":0.30,"contribution":0.30}
        ]
      }
    }
  ]
}
```

### Single-item explanation example
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:5000/api/recommendations/movies-star-odyssey/explain?email=test@example.com&type=movies"
```
```json
{
  "success": true,
  "id": "movies-star-odyssey",
  "score": 0.82,
  "explanation": {
    "plain_text_reason": "...",
    "top_user_terms": ["space opera","epic worldbuilding"],
    "matched_item_terms": ["space","galactic","epic"],
    "term_contributions": [
      {"term":"space opera","user_term_weight":1,"item_term_weight":1,"contribution_score":0.45,"contribution":0.45}
    ]
  }
}
```

### Global feature importances
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:5000/api/recommendations/global-explain?type=movies"
```
```json
{ "success": true, "type": "movies", "summary": "Top signals we use to recommend movies: ...", "top_terms": [{"term":"space","score":0.1234}] }
```

### Frontend usage
- A “Why this?” button is shown on recommendation cards in `client/src/pages/Recommendations.jsx` and `client/src/pages/RecommendationsHub.jsx`.
- Clicking it calls `GET /api/recommendations/:id/explain` and opens the `ExplanationPanel` modal (`client/src/components/ExplanationPanel.jsx`).
- The `WhyThis.jsx` page displays a simple cloud of top 20 terms per domain via `GET /api/recommendations/global-explain`.

### Implementation notes
- File: `server/services/aiRecommenderService.js`
  - Adds `getAIRecommendationsWithExplanations()` and `getGlobalFeatureImportances()`.
  - Uses OpenAI embeddings and caches item/user term embeddings in-memory.
  - Per-term contributions are approximated by computing separate embeddings for user phrases and item tokens and using cosine similarities. This is an approximation for embeddings-based recommenders; model-based methods like LIME/SHAP can be added later.
  - If embeddings fail (quota, network), returns a best-effort explanation with `partial: true`.
- Controller: `server/controllers/recommendationsController.js`
  - Adds `getRecommendationsQuery`, `getRecommendationExplanation`, `getGlobalExplanations`.
  - `explain=true` triggers explanation enrichment while keeping the original endpoint compatible when omitted.
- Routes: `server/routes/recommendations.js` wires the new endpoints.

### Environment variables
Set in `server/.env`:
- `OPENAI_API_KEY` (required for embeddings)
- `OMDB_API_KEY` (movies metadata)
- `GOOGLE_BOOKS_API_KEY` (books metadata)
- `GEMINI_API_KEY` (existing prompt-based generation)
- `CLIENT_ORIGIN` (optional CORS)

### API helpers
`client/src/api.js` now includes:
- `getRecommendations(email, { explain: false, type: 'movies' })`
- `getRecommendationExplanation(id, email, type)`
- `getGlobalExplanations(type)`

### Testing
A stub script is provided at `server/tests/explain.test.js`.
- Set `TOKEN` and `TEST_EMAIL` env vars and run: `node server/tests/explain.test.js`.

### Performance & caching
- In-memory cache avoids repeated embedding calls for identical texts/terms.
- Consider adding eviction if your catalog is large.

### Extending XAI
- You can extend `getAIRecommendationsWithExplanations()` to compute per-field weights or incorporate LIME/SHAP once a trainable model is introduced.
