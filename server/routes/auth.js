const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Log = require("../models/Log");

const router = express.Router();

// ======================================================
// 📝 SIGNUP — Register a new user
// ======================================================
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Create new user
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    // 4️⃣ Generate JWT token (with role if available)
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 5️⃣ Log signup event
    try {
      await Log.create({
        email: newUser.email,
        action: "signup",
        meta: { role: newUser.role },
      });
    } catch (logError) {
      console.error("⚠ Failed to write signup log:", logError);
    }

    // 6️⃣ Respond
    res.status(201).json({
      message: "User created successfully",
      user: { email: newUser.email },
      token,
    });
  } catch (err) {
    console.error("❌ Signup failed:", err);
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

// ======================================================
// 🔑 LOGIN — Authenticate an existing user
// ======================================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Check if user exists
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    // 2️⃣ Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // 3️⃣ Generate JWT token with role
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4️⃣ Update lastLogin & log event
    try {
      await User.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } }
      );
      await Log.create({ email: user.email, action: "login" });
    } catch (logError) {
      console.error("⚠ Failed to update lastLogin or write login log:", logError);
    }

    // 5️⃣ Respond
    res.status(200).json({
      message: "Login successful",
      user: { email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error("❌ Login failed:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

module.exports = router;
