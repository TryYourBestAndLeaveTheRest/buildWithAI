const express = require('express');
const router = express.Router();
const ListingController = require('../controllers/listingController');
const UserController = require('../controllers/userController');
const { validateListing, validateRegistration, validateLogin } = require('../middleware/validator');

// Home & Listings
router.get('/', ListingController.renderHome);
router.post('/items/new', validateListing, ListingController.createListing);

// User registration
router.get('/register', UserController.renderRegister);
router.post('/register', validateRegistration, UserController.handleRegister);

// User login
router.get('/login', UserController.renderLogin);
router.post('/login', validateLogin, UserController.handleLogin);

// User dashboard & logout
router.get('/dashboard', UserController.renderDashboard);
router.get('/logout', UserController.logout);

module.exports = router;
