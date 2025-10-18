const router = require("express").Router();
const ChatController = require("../controllers/chatController");

router.post("/", ChatController.chat);

module.exports = router;
