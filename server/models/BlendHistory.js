const mongoose = require("mongoose");

const BlendHistorySchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  partnerEmail: { type: String, required: true },
  recommendations: { type: Array, default: [] }, // store a few track details
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BlendHistory", BlendHistorySchema);
