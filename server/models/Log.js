// /p4/server/models/Log.js
const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  email: { type: String, required: false },
  action: { type: String, required: true }, // e.g. 'login', 'signup', 'preference_update'
  meta: { type: Object, default: {} },       // optional extra info (type, ip, etc.)
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Log", logSchema);