const express = require("express");
const router = express.Router();
const RecommendationsController = require("../controllers/recommendationsController");
const auth = require("../middlewares/auth");

// ✅ 0️⃣ Query-based recommendations (supports explain=true)
router.get("/", auth, RecommendationsController.getRecommendationsQuery);

// ✅ 1️⃣ Cross-domain route (must come FIRST)
router.get("/cross/:email", auth, RecommendationsController.getCrossDomainRecommendations);

// ✅ 2️⃣ History route
router.get("/:email/history", auth, RecommendationsController.getHistory);

// ✅ 5️⃣ Global feature importances (place before dynamic param routes)
router.get("/global-explain", auth, RecommendationsController.getGlobalExplanations);

// ✅ 4️⃣ Per-item explanation (place BEFORE standard route to avoid shadowing)
router.get("/:id/explain", auth, RecommendationsController.getRecommendationExplanation);

// ✅ 3️⃣ Standard recommendations route
router.get("/:email/:type", auth, RecommendationsController.getRecommendations);

module.exports = router;
