const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  users: [String],
  sessionId: String,
});

module.exports = mongoose.model("Group", groupSchema);
