const express = require('express');
const router = express.Router();
const FeedbackController = require('../controllers/feedbackController');

// Log feedback (public endpoint - can be called by any user)
router.post('/api/feedback/log', FeedbackController.logFeedback.bind(FeedbackController));

module.exports = router;
