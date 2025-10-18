const GroupService = require("../services/groupsyncService");
const { ok } = require("../utils/responses");

exports.createGroup = async (req, res, next) => {
  try {
    const result = await GroupService.createGroup(req.body);
    res.json(ok(result));
  } catch (err) {
    next(err);
  }
};

exports.getGroup = async (req, res, next) => {
  try {
    const result = await GroupService.getGroup(req.params.sessionId);
    res.json(ok(result));
  } catch (err) {
    next(err);
  }
};
