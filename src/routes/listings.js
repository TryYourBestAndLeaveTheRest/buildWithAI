const express = require('express');
const router = express.Router();
const ListingController = require('../controllers/listingController');
const { validateListing, validateInteraction } = require('../middleware/validator');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Public feed — guests can browse, authenticated users can also post
router.get('/', optionalAuth, ListingController.renderHome);

// Protected — create and interact require auth
router.post('/items/new', requireAuth, validateListing, ListingController.createListing);
router.post('/items/:id/interact', requireAuth, validateInteraction, ListingController.interactWithListing);

module.exports = router;
