// server/routes/feedbackRoutes.js
const express = require("express");
const Feedback = require("../models/Feedback");

const router = express.Router();

// ✅ POST feedback/review
router.post("/", async (req, res) => {
  try {
    const { userId, contentId, type, feedback, review } = req.body;

    // 🧠 Validate required fields
    if (!userId || !contentId || !type || !feedback) {
      return res.status(400).json({
        message: "Missing required fields",
        details: { userId, contentId, type, feedback },
      });
    }

    const newFeedback = new Feedback({
      userId,
      contentId,
      type,
      feedback,
      review,
      createdAt: new Date(),
    });

    await newFeedback.save();
    res.status(201).json(newFeedback);
  } catch (err) {
    console.error("❌ Feedback save error:", err);
    res
      .status(500)
      .json({ message: "Error saving feedback", error: err.message });
  }
});

// ✅ GET all reviews for a specific content
router.get("/:contentId/reviews", async (req, res) => {
  try {
    const { contentId } = req.params;
    const feedbacks = await Feedback.find({ contentId }).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reviews", error: err.message });
  }
});

module.exports = router;
