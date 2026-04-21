const Log = require('../models/Log');

/**
 * Centralized Error Handler
 * Renders a styled EJS error page for all HTML requests.
 * Only logs critical (500) errors to the database.
 */
const errorHandler = async (err, req, res, next) => {
  const statusCode = err.status || 500;

  // Log critical errors to DB
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
    } catch (logError) {
      console.error('Failed to log error to DB:', logError);
    }

    console.error(`[${req.method}] ${req.originalUrl} — ${err.message}`);
    if (process.env.NODE_ENV !== 'production') {
      console.error(err.stack);
    }
  }

  // Choose response format: HTML for browser requests, JSON for API/XHR
  const wantsJson =
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes('application/json'));

  if (wantsJson) {
    return res.status(statusCode).json({
      success: false,
      message: statusCode === 500
        ? 'A critical error occurred. Our team has been notified.'
        : err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  }

  // Render the styled error page
  return res.status(statusCode).render('error', {
    title: `Error ${statusCode}`,
    statusCode,
    message: statusCode === 500
      ? 'A critical error occurred. Our team has been notified.'
      : err.message
  });
};

module.exports = errorHandler;
