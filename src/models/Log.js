const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['info', 'warn', 'error', 'critical'],
    default: 'error'
  },
  message: {
    type: String,
    required: true
  },
  stack: {
    type: String
  },
  path: {
    type: String
  },
  method: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30 // Auto-delete logs after 30 days
  }
});

module.exports = mongoose.model('Log', LogSchema);
