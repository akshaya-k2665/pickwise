// server/services/feedbackService.js
const Feedback = require("../models/Feedback");

async function getAverageRating(contentId) {
  const feedbacks = await Feedback.find({ contentId, rating: { $exists: true } });
  if (!feedbacks.length) return { average: 0, total: 0 };

  const average =
    feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length;

  return { average: average.toFixed(1), total: feedbacks.length };
}

module.exports = { getAverageRating };
