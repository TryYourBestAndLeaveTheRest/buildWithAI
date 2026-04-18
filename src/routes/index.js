const express = require('express');
const router = express.Router();
const ListingController = require('../controllers/listingController');
const UserController = require('../controllers/userController');

// Home & Listings
router.get('/', ListingController.renderHome);
router.post('/items/new', ListingController.createListing);

// User registration & Dashboard
router.get('/register', UserController.renderRegister);
router.post('/register', UserController.handleRegister);
router.get('/dashboard', UserController.renderDashboard);

module.exports = router;
