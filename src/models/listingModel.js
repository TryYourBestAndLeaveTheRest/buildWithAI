const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: String,
    required: true,
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dorm: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['have', 'need'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'bargaining', 'agreed', 'completed', 'canceled', 'disputed'],
    default: 'active',
    index: true
  },
  activeBargainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Fetch listings by type with populated user/bargainer info.
 * Supports pagination via skip/limit.
 */
ListingSchema.statics.getByType = async function (type, { page = 1, limit = 12 } = {}) {
  const query = type ? { type } : {};
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    this.find(query)
      .populate('user', 'name dorm')
      .populate('activeBargainer', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(query)
  ]);
  return { items, total, page, totalPages: Math.ceil(total / limit) };
};

module.exports = mongoose.model('Listing', ListingSchema);