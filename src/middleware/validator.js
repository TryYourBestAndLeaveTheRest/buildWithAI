const { body, validationResult } = require('express-validator');
const { DORM_OPTIONS } = require('../config/registerOptions');

// Helper to build the validation error middleware for a given view
function makeErrorRenderer(view, extraLocals = {}) {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render(view, {
        title: view.charAt(0).toUpperCase() + view.slice(1),
        error: errors.array()[0].msg,
        formData: req.body,
        session: req.session,
        ...extraLocals
      });
    }
    next();
  };
}

const validateListing = [
  body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters long'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
  body('price').trim().isLength({ min: 1 }).withMessage('Price or trade value is required'),
  body('dorm').trim().isLength({ min: 2 }).withMessage('Dorm / location is required'),
  body('type').isIn(['have', 'need']).withMessage('Post type must be "have" or "need"'),
  makeErrorRenderer('index')
];

const validateInteraction = [
  body('action').isIn(['buy', 'provide']).withMessage('Invalid interaction action'),
  body('comment').optional({ values: 'falsy' }).trim().isLength({ max: 300 }).withMessage('Comment must be 300 characters or less'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error(errors.array()[0].msg);
      err.status = 400;
      return next(err);
    }
    next();
  }
];

const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone')
    .trim()
    .matches(/^\+?[0-9][0-9\s\-()]{7,18}$/)
    .withMessage('Please enter a valid phone number'),
  makeErrorRenderer('register', { dormOptions: DORM_OPTIONS })
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
  makeErrorRenderer('login')
];

const validateTransactionAction = [
  body('comment').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Comment must be 500 characters or less'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error(errors.array()[0].msg);
      err.status = 400;
      return next(err);
    }
    next();
  }
];

module.exports = {
  validateListing,
  validateRegistration,
  validateLogin,
  validateInteraction,
  validateTransactionAction
};
