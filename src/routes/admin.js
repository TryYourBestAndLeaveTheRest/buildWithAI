const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

// Admin Dashboard (protected by requireAdmin)
router.get('/admin', requireAdmin, AdminController.renderDashboard);

// API endpoints for dashboard data
router.get('/api/admin/session-data', requireAdmin, AdminController.getSessionData);
router.get('/api/admin/pageview-data', requireAdmin, AdminController.getPageViewData);
router.get('/api/admin/data/:resource', requireAdmin, AdminController.getDataList);

module.exports = router;
