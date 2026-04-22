const { PageView, SessionAnalytics } = require('../models/analyticsModel');

class FeedbackService {

  /**
   * Get session analytics
   */
  async getSessionAnalytics() {
    try {
      const activeSessions = await SessionAnalytics.countDocuments({ endTime: null });
      
      const totalSessions = await SessionAnalytics.countDocuments();
      
      const avgSessionDuration = await SessionAnalytics.aggregate([
        {
          $match: { duration: { $ne: null } },
        },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$duration' },
          },
        },
      ]);

      const avgPageViews = await SessionAnalytics.aggregate([
        {
          $group: {
            _id: null,
            avgPageViews: { $avg: '$pageViews' },
          },
        },
      ]);

      const recentSessions = await SessionAnalytics.find()
        .populate('userId', 'email name')
        .sort({ startTime: -1 })
        .limit(10);

      return {
        activeSessions,
        totalSessions,
        avgSessionDuration: avgSessionDuration[0]?.avgDuration || 0,
        avgPageViews: avgPageViews[0]?.avgPageViews || 0,
        recentSessions,
      };
    } catch (error) {
      console.error('[FeedbackService] Error getting session analytics:', error.message);
      throw error;
    }
  }

  /**
   * Get page view analytics
   */
  async getPageViewAnalytics() {
    try {
      const totalPageViews = await PageView.countDocuments();
      
      const pageViewsByUrl = await PageView.aggregate([
        {
          $group: {
            _id: '$pageUrl',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
      ]);

      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const viewsInLast24 = await PageView.countDocuments({ viewedAt: { $gte: last24Hours } });

      return {
        totalPageViews,
        pageViewsByUrl,
        viewsInLast24,
      };
    } catch (error) {
      console.error('[FeedbackService] Error getting page view analytics:', error.message);
      throw error;
    }
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics() {
    try {
      const sessionAnalytics = await this.getSessionAnalytics();
      const pageViewAnalytics = await this.getPageViewAnalytics();

      return {
        sessions: sessionAnalytics,
        pageViews: pageViewAnalytics,
      };
    } catch (error) {
      console.error('[FeedbackService] Error getting dashboard metrics:', error.message);
      throw error;
    }
  }
}

module.exports = new FeedbackService();
