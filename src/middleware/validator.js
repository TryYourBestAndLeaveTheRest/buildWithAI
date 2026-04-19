const { body, validationResult } = require('express-validator');

const validateListing = [
  body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters long'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
  body('price').optional().isNumeric().withMessage('Price must be a number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('error', { 
        title: 'Validation Error', 
        message: errors.array()[0].msg 
      });
    }
    next();
  }
];

const validateRegistration = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('register', { 
        title: 'Register', 
        error: errors.array()[0].msg 
      });
    }
    next();
  }
];

module.exports = {
  validateListing,
  validateRegistration
};
