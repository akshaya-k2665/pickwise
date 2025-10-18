const UserService = require("../services/userService");
const { ok } = require("../utils/responses");

// 🧩 User Signup
exports.signup = async (req, res, next) => {
  try {
    const result = await UserService.signup(req.body);
    res.status(201).json(ok(result));
  } catch (err) {
    next(err);
  }
};

// 🔐 User Login
exports.login = async (req, res, next) => {
  try {
    const token = await UserService.login(req.body);
    res.json(ok({ token }));
  } catch (err) {
    next(err);
  }
};

// 🎯 Save Preferences (movies / music / books)
exports.savePreferences = async (req, res, next) => {
  try {
    const { email, type } = req.params; // type = "movies" | "music" | "books"
    const preferencesData = req.body;

    const user = await UserService.savePreferences(email, type, preferencesData);
    res.json(ok({ message: `${type} preferences saved`, preferences: user.preferences[type] }));
  } catch (err) {
    next(err);
  }
};

// 🎯 Get Preferences (movies / music / books)
exports.getPreferences = async (req, res, next) => {
  try {
    const { email, type } = req.params;
    const preferences = await UserService.getPreferences(email, type);
    res.json(ok({ preferences }));
  } catch (err) {
    next(err);
  }
};
