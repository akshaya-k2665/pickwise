// server/controllers/feedbackController.js
const Feedback = require("../models/Feedback");

const FeedbackController = {
  // ✅ Save or update feedback
  async saveFeedback(req, res) {
    try {
      const { userId, contentId, type, feedback, review, rating } = req.body;

      if (!contentId || !type)
        return res.status(400).json({ error: "Missing required fields" });

      // Find existing feedback by same user for same content
      const existing = await Feedback.findOne({ userId, contentId });

      if (existing) {
        if (feedback) existing.feedback = feedback;
        if (review) existing.review = review;
        if (rating) existing.rating = rating;
        await existing.save();
        return res.status(200).json({ message: "Feedback updated successfully" });
      }

      // Create new feedback entry
      const newFeedback = new Feedback({
        userId,
        contentId,
        type,
        feedback,
        review,
        rating,
      });
      await newFeedback.save();
      res.status(201).json({ message: "Feedback saved successfully" });
    } catch (error) {
      console.error("❌ Error saving feedback:", error.message);
      res.status(500).json({ error: "Failed to save feedback" });
    }
  },

  // ✅ Fetch all reviews for a given content item
  async getReviews(req, res) {
    try {
      const { contentId } = req.params;
      const reviews = await Feedback.find(
        { contentId, review: { $exists: true, $ne: "" } },
        { review: 1, feedback: 1, createdAt: 1 }
      ).populate("userId", "name email"); // optional: populate user info

      res.json(reviews);
    } catch (error) {
      console.error("❌ Error fetching reviews:", error.message);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  },

  // ✅ Average rating or total feedbacks (optional)
  async getAverageRating(req, res) {
    try {
      const { contentId } = req.params;
      const feedbacks = await Feedback.find({ contentId, rating: { $exists: true } });

      if (feedbacks.length === 0) {
        return res.json({ averageRating: 0, totalRatings: 0 });
      }

      const average =
        feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length;

      res.json({
        averageRating: average.toFixed(1),
        totalRatings: feedbacks.length,
      });
    } catch (error) {
      console.error("❌ Error fetching average rating:", error.message);
      res.status(500).json({ error: "Failed to fetch average rating" });
    }
  },
};

module.exports = FeedbackController;
