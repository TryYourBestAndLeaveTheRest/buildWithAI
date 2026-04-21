const express = require('express');
const router = express.Router();

const listingRoutes     = require('./listings');
const userRoutes        = require('./users');
const transactionRoutes = require('./transactions');

// Mount sub-routers
router.use('/', listingRoutes);
router.use('/', userRoutes);
router.use('/transactions', transactionRoutes);

module.exports = router;
