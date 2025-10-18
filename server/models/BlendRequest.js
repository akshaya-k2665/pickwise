const mongoose = require("mongoose");

const BlendRequestSchema = new mongoose.Schema({
  requesterEmail: { type: String, required: true },
  recipientEmail: { type: String, required: true },
  message: { type: String, default: "" },
  artistSeeds: { type: [String], default: [] }, // optional artist names or ids provided by requester
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
});

module.exports = mongoose.model("BlendRequest", BlendRequestSchema);
