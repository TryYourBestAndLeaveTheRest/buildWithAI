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
  },
  type: {
    type: String,
    enum: ['have', 'need'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Listing = mongoose.model('Listing', ListingSchema);
Listing.getByType = async function (type) {
  if (type === 'have') {
    return this.find({}).sort({ createdAt: -1 }).limit(10);
  }
  if (type === 'need') {
    return this.find({}).sort({ createdAt: -1 }).limit(10);
  }
  return this.find({}).sort({ createdAt: -1 }).limit(10);
}

Listing.create = async function (listingData) {
  const listing = new this(listingData);
  return await listing.save();
}
module.exports = Listing;