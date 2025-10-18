const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middlewares/auth");

// 🎯 Save or update preferences for movies, books, or music
router.post("/preferences/:email/:type", auth, async (req, res) => {
  try {
    const { email, type } = req.params;

    // ✅ Safely handle both {genres,...} and {preferences:{...}} payloads
    const body = req.body?.preferences || req.body || {};
    let { genres = [], era = "Any", favorites = [] } = body;

    // ✅ Validate category
    if (!["movies", "music", "books"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid preference type. Must be movies, music, or books.",
      });
    }

    // 🧠 Normalize input data
    if (typeof genres === "string") {
      genres = genres.split(",").map((g) => g.trim()).filter(Boolean);
    }
    if (!Array.isArray(genres)) genres = [];

    if (typeof favorites === "string") {
      favorites = favorites.split(",").map((f) => f.trim()).filter(Boolean);
    }
    if (!Array.isArray(favorites)) favorites = [];

    // 🔄 Update nested preferences dynamically
    const updateField = {};
    updateField[`preferences.${type}`] = { genres, era, favorites };

    const user = await User.findOneAndUpdate({ email }, updateField, {
      new: true,
    }).select("email preferences role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(`✅ ${type} preferences updated for:`, email);
    return res.json({ success: true, data: user.preferences[type] });
  } catch (err) {
    console.error("❌ Error saving preferences:", err);
    return res.status(500).json({
      success: false,
      message: "Error saving preferences",
    });
  }
});

// 📖 Get preferences for a specific type
router.get("/preferences/:email/:type", auth, async (req, res) => {
  try {
    const { email, type } = req.params;

    if (!["movies", "music", "books"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid preference type.",
      });
    }

    const user = await User.findOne({ email }).select("email preferences role");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const prefs = user.preferences?.[type] || {
      genres: [],
      era: "",
      favorites: [],
    };

    return res.json({ success: true, data: prefs });
  } catch (err) {
    console.error("❌ Error fetching preferences:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching preferences",
    });
  }
});

// 🎵 SAVE music preferences
router.post("/preferences/:email/music", async (req, res) => {
  try {
    const { genres, favorites, era, languages, artists } = req.body;
    const email = req.params.email;

    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          "preferences.music.genres": genres || [],
          "preferences.music.favorites": favorites || [],
          "preferences.music.era": era || "",
          "preferences.music.languages": languages || [],
          "preferences.music.artists": artists || [],
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      message: "✅ Music preferences saved successfully!",
      preferences: updatedUser.preferences.music,
    });
  } catch (error) {
    console.error("Error saving music preferences:", error);
    res.status(500).json({ error: "Failed to save music preferences" });
  }
});

// 🎵 GET Music Preferences
router.get("/preferences/:email/music", async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email });

    if (!user || !user.preferences?.music) {
      return res.json({
        languages: [],
        genres: [],
        artists: [],
      });
    }

    res.json(user.preferences.music);
  } catch (error) {
    console.error("Error fetching music preferences:", error);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

module.exports = router;
