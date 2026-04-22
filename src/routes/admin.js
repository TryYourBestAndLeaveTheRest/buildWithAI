const express = require('express');
const router = express.Router();
const FeedbackController = require('../controllers/feedbackController');
const { requireAdmin } = require('../middleware/auth');

// Admin Dashboard (protected by requireAdmin)
router.get('/admin', requireAdmin, FeedbackController.renderAdminDashboard.bind(FeedbackController));

// API endpoints for dashboard data
router.get('/api/admin/feedback-data', requireAdmin, FeedbackController.getFeedbackData.bind(FeedbackController));
router.get('/api/admin/session-data', requireAdmin, FeedbackController.getSessionData.bind(FeedbackController));
router.get('/api/admin/pageview-data', requireAdmin, FeedbackController.getPageViewData.bind(FeedbackController));

module.exports = router;
