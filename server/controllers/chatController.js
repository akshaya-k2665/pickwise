const ChatService = require("../services/chatService"); // ✅ this must exist
const { ok } = require("../utils/responses");

exports.chat = async (req, res, next) => {
  try {
    const reply = await ChatService.chat(req.body);
    res.json(ok(reply));
  } catch (err) {
    console.error("Legacy movie chat error:", err);
    next(err);
  }
};
