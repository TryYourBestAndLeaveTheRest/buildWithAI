const { PageView, SessionAnalytics } = require('../models/analyticsModel');

/**
 * Track page views and session analytics
 */
const analyticsMiddleware = async (req, res, next) => {
  try {
    const sessionId = req.sessionID;
    const userId = req.session?.userId || null;
    const pageUrl = req.originalUrl;
    const userAgent = req.get('user-agent') || '';
    const referrer = req.get('referrer') || '';
    const ipAddress = req.ip || '';

    // Initialize session start time if not already set
    if (!req.session.sessionStartTime) {
      req.session.sessionStartTime = Date.now();
      
      // Create new session analytics record
      await SessionAnalytics.create({
        sessionId,
        userId,
        userAgent,
        ipAddress,
      });
    } else {
      // Increment page views count after the first request in this session
      await SessionAnalytics.findOneAndUpdate(
        { sessionId },
        { $inc: { pageViews: 1 } },
        { upsert: true }
      );
    }

    // Log page view
    await PageView.create({
      sessionId,
      userId,
      pageUrl,
      referrer,
      userAgent,
      ipAddress,
    });

    next();
  } catch (error) {
    console.error('[Analytics] Error tracking page view:', error.message);
    // Don't block request on analytics error
    next();
  }
};

module.exports = {
  analyticsMiddleware,
};
