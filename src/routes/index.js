const express = require('express');
const router = express.Router();
const ListingController = require('../controllers/listingController');
const UserController = require('../controllers/userController');
const { validateListing, validateRegistration, validateLogin } = require('../middleware/validator');
const { requireAuth, redirectIfAuthenticated } = require('../middleware/auth');

// Home & Listings
router.get('/', requireAuth, ListingController.renderHome);
router.post('/items/new', requireAuth, validateListing, ListingController.createListing);

// User registration
router.get('/register', redirectIfAuthenticated, UserController.renderRegister);
router.post('/register', redirectIfAuthenticated, validateRegistration, UserController.handleRegister);

// User login
router.get('/login', redirectIfAuthenticated, UserController.renderLogin);
router.post('/login', redirectIfAuthenticated, validateLogin, UserController.handleLogin);

// User dashboard & logout
router.get('/dashboard', requireAuth, UserController.renderDashboard);
router.get('/profile', requireAuth, UserController.renderProfile);
router.get('/logout', requireAuth, UserController.logout);

module.exports = router;
