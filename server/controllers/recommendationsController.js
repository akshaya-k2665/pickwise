// ===============================================================
// 📦 Imports & Setup
// ===============================================================
const Recommendation = require("../models/Recommendation");
const User = require("../models/User");
const {
  getRecommendations,
  getCrossDomainRecommendations,
} = require("../services/recommendationsService");
const {
  getAIRecommendationsWithExplanations,
  getGlobalFeatureImportances,
} = require("../services/aiRecommenderService");

// Helper: generate a simple stable ID from title/type if no ID present
function slugifyId(item, type) {
  if (item.id || item._id) return String(item.id || item._id);
  const base = `${type || "item"}-${item.title || item.name || "untitled"}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || `${type}-unknown`;
}

async function getUserPrefs(email) {
  const user = await User.findOne({ email });
  return user?.preferences || {};
}

// ===============================================================
// 🎯 1️⃣ Fetch Single-Domain Recommendations (Movies, Books, Music)
// ===============================================================
exports.getRecommendations = async (req, res) => {
  try {
    const { email, type } = req.params;
    const { explain } = req.query;
    console.log(`📩 Request received for: ${email}, Type: ${type}`);

    if (!email || !type) {
      return res.status(400).json({
        success: false,
        message: "Missing email or type parameter.",
      });
    }

    if (!["movies", "books", "music"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recommendation type.",
      });
    }

    // 🔍 Call the recommendation service to get candidate items
    const data = await getRecommendations(email, type);

    if (!data || data.length === 0) {
      console.warn(`⚠️ No ${type} recommendations found for ${email}`);
      return res.status(200).json({
        success: true,
        recommendations: [],
        message: `⚠️ No ${type} recommendations found.`,
      });
    }

    // If explain=true, enrich with XAI using embedding-based scorer
    if (String(explain).toLowerCase() === "true") {
      const prefs = await getUserPrefs(email);
      const enriched = await getAIRecommendationsWithExplanations(prefs, data, type);
      const withIds = enriched.map((it) => ({ ...it, id: slugifyId(it, type) }));

      // 💾 Save in history
      await Recommendation.create({
        email,
        type,
        items: withIds,
        createdAt: new Date(),
      });

      console.log(`✅ ${type} recommendations (with explanations) saved for ${email}`);
      return res.status(200).json({
        success: true,
        recommendations: withIds,
        message: `✅ ${type} recommendations with explanations fetched successfully`,
      });
    }

    // 💾 Save in history (non-explain)
    const withIds = data.map((it) => ({ ...it, id: slugifyId(it, type) }));
    await Recommendation.create({
      email,
      type,
      items: withIds,
      createdAt: new Date(),
    });

    console.log(`✅ ${type} recommendations saved for ${email}`);
    res.status(200).json({
      success: true,
      recommendations: withIds,
      message: `✅ ${type} recommendations fetched successfully`,
    });
  } catch (err) {
    console.error("❌ Controller Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Error fetching recommendations",
    });
  }
};

// ===============================================================
// 🔍 1.1 Query-based recommendations: GET /api/recommendations?email=...&type=movies&explain=true
// ===============================================================
exports.getRecommendationsQuery = async (req, res) => {
  try {
    const { email, type = "movies", explain } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: "Missing email" });
    }
    if (!["movies", "books", "music"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }
    // Delegate to existing handler by faking params
    req.params = { email, type };
    return exports.getRecommendations(req, res);
  } catch (err) {
    console.error("❌ Query-based recommendations error:", err.message);
    res.status(500).json({ success: false, message: "Error" });
  }
};

// ===============================================================
// 🌍 2️⃣ Fetch Cross-Domain Recommendations (User Input or Preference)
// ===============================================================
exports.getCrossDomainRecommendations = async (req, res) => {
  try {
    const { email } = req.params;
    const { base, query } = req.query; // user may provide `base` or `query`

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Missing email parameter.",
      });
    }

    // Determine whether to use user input or stored preference
    let source = "";
    if (query) {
      source = `User Input: "${query}"`;
    } else if (base) {
      source = `Base Preference: "${base}"`;
    } else {
      return res.status(400).json({
        success: false,
        message: "Provide either a 'query' or 'base' parameter.",
      });
    }

    console.log(`🌍 Cross-domain request for ${email} | ${source}`);

    // 🔍 Fetch AI results (Gemini + APIs)
    const result = await getCrossDomainRecommendations(email, query || base);

    if (!result || !result.recommendations) {
      return res.status(200).json({
        success: true,
        recommendations: {},
        message: "⚠️ No cross-domain recommendations found.",
      });
    }

    // 💾 Save to history
    await Recommendation.create({
      email,
      type: query ? `cross-query` : `cross-${base}`,
      items: result.recommendations,
      createdAt: new Date(),
    });

    console.log(`✅ Cross-domain recommendations generated for ${email}`);

    res.status(200).json({
      success: true,
      ...result, // includes baseQuery/baseType and recommendations
      message: `✅ Cross-domain recommendations fetched successfully based on ${query ? "your input" : "preferences"}`,
    });
  } catch (err) {
    console.error("❌ Cross-domain Controller Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Error fetching cross-domain recommendations",
    });
  }
};

// ===============================================================
// 📜 3️⃣ Fetch User Recommendation History
// ===============================================================
exports.getHistory = async (req, res) => {
  try {
    const { email } = req.params;
    console.log("📩 Fetching history for:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email parameter missing.",
      });
    }

    const history = await Recommendation.find({ email })
      .sort({ createdAt: -1 })
      .limit(5);

    if (!history.length) {
      return res.status(200).json({
        success: true,
        history: [],
        message: "No recommendation history found.",
      });
    }

    res.status(200).json({
      success: true,
      history,
      message: "✅ History fetched successfully",
    });
  } catch (err) {
    console.error("❌ History fetch error:", err.message);
    res.status(500).json({
      success: false,
      message: "Error fetching history",
    });
  }
};

// ===============================================================
// 🧠 4️⃣ Per-recommendation Explanation: GET /api/recommendations/:id/explain?email=<email>&type=movies
// ===============================================================
exports.getRecommendationExplanation = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, type = "movies" } = req.query;
    if (!email || !id) {
      return res.status(400).json({ success: false, message: "Missing email or id" });
    }
    if (!["movies", "books", "music"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    let found = null;
    try {
      const latest = await Recommendation.findOne({ email, type }).sort({ createdAt: -1 });
      if (latest && Array.isArray(latest.items)) {
        found = latest.items.find((x) => String(x.id) === String(id));
      }
    } catch (dbErr) {
      // ignore DB errors and fall back to fresh fetch
    }

    if (!found) {
      const items = await getRecommendations(email, type);
      const withIds = (items || []).map((it) => ({ ...it, id: slugifyId(it, type) }));
      found = withIds.find((x) => String(x.id) === String(id));
      if (!found) {
        return res.status(404).json({ success: false, message: "Item not found in recommendations" });
      }
    }

    const prefs = await getUserPrefs(email);
    const [enriched] = await getAIRecommendationsWithExplanations(prefs, [found], type);
    return res.status(200).json({ success: true, id, explanation: enriched.explanation, score: enriched.score });
  } catch (err) {
    console.error("❌ Single explanation error:", err.message);
    res.status(500).json({ success: false, message: "Error generating explanation" });
  }
};

// ===============================================================
// 🌐 5️⃣ Global Feature Importances: GET /api/recommendations/global-explain?type=movies
// ===============================================================
exports.getGlobalExplanations = async (req, res) => {
  try {
    const { type = "movies" } = req.query;
    if (!["movies", "books", "music"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }
    const result = await getGlobalFeatureImportances([], type);
    // Example response:
    // { success: true, type: "movies", top_terms: [{term, score}], summary }
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("❌ Global explain error:", err.message);
    res.status(500).json({ success: false, message: "Error computing global explanations" });
  }
};
