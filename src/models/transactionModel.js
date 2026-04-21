const mongoose = require('mongoose');

const TransactionCommentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const TransactionSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
    index: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  initiatorRole: {
    type: String,
    enum: ['buyer', 'seller'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'agreed', 'completed', 'canceled', 'disputed'],
    default: 'pending',
    index: true
  },
  comments: {
    type: [TransactionCommentSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

TransactionSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Transaction', TransactionSchema);