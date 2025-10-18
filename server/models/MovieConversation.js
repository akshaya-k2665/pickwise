const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  movieRecommendations: [{
    movieId: {
      type: String // Changed from ObjectId to String for IMDB IDs
    },
    reason: String,
    confidence: Number
  }]
});

const movieConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    default: 'Movie Recommendation Chat'
  },
  userPreferences: {
    favoriteGenres: [String],
    favoriteActors: [String],
    favoriteDirectors: [String],
    preferredMood: [String],
    preferredDecade: [String],
    streamingPlatforms: [String]
  },
  messages: [messageSchema],
  currentMood: {
    type: String,
    enum: ['happy', 'sad', 'excited', 'romantic', 'thrilling', 'mysterious', 'inspiring', 'funny', 'dramatic', 'action-packed', 'relaxing', 'thought-provoking', 'unknown']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Index for efficient queries
movieConversationSchema.index({ userId: 1, createdAt: -1 });

// Update the updatedAt field before saving
movieConversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('MovieConversation', movieConversationSchema);
