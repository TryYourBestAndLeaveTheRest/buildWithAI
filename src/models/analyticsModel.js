const mongoose = require('mongoose');

const PageViewSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  pageUrl: {
    type: String,
    required: true,
  },
  referrer: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
    default: '',
  },
  viewedAt: {
    type: Date,
    default: Date.now,
  },
});

const SessionAnalyticsSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
    default: null,
  },
  duration: {
    type: Number, // Duration in milliseconds
    default: null,
  },
  pageViews: {
    type: Number,
    default: 1,
  },
  userAgent: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
    default: '',
  },
});

// Indexes for efficient querying
PageViewSchema.index({ sessionId: 1, viewedAt: -1 });
PageViewSchema.index({ userId: 1, viewedAt: -1 });
PageViewSchema.index({ viewedAt: -1 });

SessionAnalyticsSchema.index({ userId: 1 });
SessionAnalyticsSchema.index({ startTime: -1 });

module.exports = {
  PageView: mongoose.model('PageView', PageViewSchema),
  SessionAnalytics: mongoose.model('SessionAnalytics', SessionAnalyticsSchema),
};
