const router = require("express").Router();
const GroupController = require("../controllers/groupsyncController");

router.post("/", GroupController.createGroup);
router.get("/:sessionId", GroupController.getGroup);

module.exports = router;
