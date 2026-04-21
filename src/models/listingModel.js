const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
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

const Listing = mongoose.model('Listing', ListingSchema);
Listing.getByType = async function (type) {
  const query = type ? { type } : {};
  return this.find(query)
    .populate('user', 'name')
    .populate('activeBargainer', 'name')
    .sort({ createdAt: -1 })
    .limit(10);
}

Listing.create = async function (listingData) {
  const listing = new this(listingData);
  return await listing.save();
}
module.exports = Listing;