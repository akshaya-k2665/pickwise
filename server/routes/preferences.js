import express from "express";
import Preferences from "../models/Preferences.js";

const router = express.Router();

// 🔹 Save or update preferences
router.post("/:email", async (req, res) => {
  const { email } = req.params;
  const { genres, era, favorites } = req.body;

  try {
    let prefs = await Preferences.findOne({ email });

    if (prefs) {
      // update existing
      prefs.genres = genres;
      prefs.era = era;
      prefs.favorites = favorites;
      await prefs.save();
    } else {
      // create new
      prefs = new Preferences({ email, genres, era, favorites });
      await prefs.save();
    }

    res.json(prefs);
  } catch (err) {
    console.error("❌ Error saving preferences:", err);
    res.status(500).json({ error: "Server error while saving preferences" });
  }
});

// 🔹 Get preferences
router.get("/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const prefs = await Preferences.findOne({ email });
    if (!prefs) {
      return res.status(404).json({ message: "Preferences not found" });
    }
    res.json(prefs);
  } catch (err) {
    console.error("❌ Error fetching preferences:", err);
    res.status(500).json({ error: "Server error while fetching preferences" });
  }
});

export default router;
