const mongoose = require("mongoose");

const RecommendationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  // New flexible fields to store different domains and XAI-enriched items
  type: { type: String }, // e.g., 'movies', 'books', 'music', 'cross-query'
  items: { type: [mongoose.Schema.Types.Mixed], default: undefined },

  // Backward compatibility: legacy movies array
  movies: [
    {
      title: String,
      year: String,
      poster: String,
      genres: [String],
      overview: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Recommendation", RecommendationSchema);
