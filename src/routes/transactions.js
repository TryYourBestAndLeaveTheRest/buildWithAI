const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const { validateTransactionAction } = require('../middleware/validator');
const { requireAuth } = require('../middleware/auth');

// All transaction routes require authentication
router.use(requireAuth);

// View transaction detail
router.get('/:id', TransactionController.renderDetail);

// Lifecycle actions
router.post('/:id/accept',  validateTransactionAction, TransactionController.handleAccept);
router.post('/:id/decline', validateTransactionAction, TransactionController.handleDecline);
router.post('/:id/complete', validateTransactionAction, TransactionController.handleComplete);
router.post('/:id/cancel',  validateTransactionAction, TransactionController.handleCancel);

// Add comment to discussion thread
router.post('/:id/comment', validateTransactionAction, TransactionController.handleAddComment);

module.exports = router;
