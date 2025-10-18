// server/models/Feedback.js
const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  contentId: { type: String, required: true },
  type: { type: String, required: true },
  feedback: {
    type: String,
    enum: ["like", "dislike", "neutral"],
    required: true,
  },
  review: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
