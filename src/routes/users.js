const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const TransactionController = require('../controllers/transactionController');
const { validateRegistration, validateLogin } = require('../middleware/validator');
const { requireAuth, redirectIfAuthenticated } = require('../middleware/auth');

// Registration
router.get('/register', redirectIfAuthenticated, UserController.renderRegister);
router.post('/register', redirectIfAuthenticated, validateRegistration, UserController.handleRegister);

// Login
router.get('/login', redirectIfAuthenticated, UserController.renderLogin);
router.post('/login', redirectIfAuthenticated, validateLogin, UserController.handleLogin);

// Dashboard and profile (require auth)
router.get('/dashboard', requireAuth, UserController.renderDashboard);
router.get('/profile', requireAuth, UserController.renderProfile);

// Logout
router.get('/logout', requireAuth, UserController.logout);

// Notifications center
router.get('/notifications', requireAuth, TransactionController.renderNotifications);

module.exports = router;
