const express = require('express');
const router = express.Router();
const ListingController = require('../controllers/listingController');
const UserController = require('../controllers/userController');
const { validateListing, validateRegistration } = require('../middleware/validator');

// Home & Listings
router.get('/', ListingController.renderHome);
router.post('/items/new', validateListing, ListingController.createListing);

// User registration & Dashboard
router.get('/register', UserController.renderRegister);
router.post('/register', validateRegistration, UserController.handleRegister);
router.get('/dashboard', UserController.renderDashboard);

module.exports = router;
