/* eslint-disable no-undef */
// server/routes/moodRoutes.js
const express = require("express");
const { getMoviesByMood } = require("../controllers/moodController");

const router = express.Router();

router.get("/:genre", getMoviesByMood);

module.exports = router;
