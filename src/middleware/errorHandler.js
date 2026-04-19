const Log = require('../models/Log');

/**
 * Centralized Error Handler
 * Only logs critical (500) errors to the database.
 */
const errorHandler = async (err, req, res, next) => {
  const statusCode = err.status || 500;
  
  // If it's a critical error (500)
  if (statusCode === 500) {
    try {
      await Log.create({
        level: 'critical',
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        path: req.originalUrl,
        method: req.method,
        userId: req.session ? req.session.userId : null
      });
      
      // Potential: Send notification to admin (e.g., via email or webhook) if needed
    } catch (logError) {
      console.error('Failed to log error to DB:', logError);
    }
  }

  // Final response to client
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 
      ? 'A critical error occurred. Our team has been notified.' 
      : err.message,
    // Don't leak stack trace in production
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorHandler;
