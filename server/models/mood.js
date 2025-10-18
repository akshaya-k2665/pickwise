// server/models/Mood.js
const mongoose = require("mongoose");

const moodSchema = new mongoose.Schema({
  email: { type: String, required: true },
  mood: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Mood", moodSchema);
