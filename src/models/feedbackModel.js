const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Allow anonymous feedback
  },
  sessionId: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    enum: ['exit-intent', 'timed-trigger', 'floating-button', 'direct'],
    default: 'floating-button',
  },
  action: {
    type: String,
    enum: ['redirected-to-form', 'dismissed'],
    required: true,
  },
  pageUrl: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  userAgent: {
    type: String,
    default: '',
  },
});

// Index for analytics queries
FeedbackSchema.index({ timestamp: -1 });
FeedbackSchema.index({ source: 1, action: 1 });
FeedbackSchema.index({ userId: 1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);
