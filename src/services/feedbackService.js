const Feedback = require('../models/feedbackModel');
const { PageView, SessionAnalytics } = require('../models/analyticsModel');

class FeedbackService {
  /**
   * Log feedback action
   */
  async logFeedback(data) {
    try {
      const feedback = new Feedback({
        userId: data.userId || null,
        sessionId: data.sessionId,
        source: data.source || 'floating-button',
        action: data.action,
        pageUrl: data.pageUrl || '',
        userAgent: data.userAgent || '',
      });
      await feedback.save();
      return feedback;
    } catch (error) {
      console.error('[FeedbackService] Error logging feedback:', error.message);
      throw error;
    }
  }

  /**
   * Get feedback analytics
   */
  async getFeedbackAnalytics() {
    try {
      const totalFeedback = await Feedback.countDocuments();
      
      const feedbackBySource = await Feedback.aggregate([
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
          },
        },
      ]);

      const feedbackByAction = await Feedback.aggregate([
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
          },
        },
      ]);

      const conversions = await Feedback.countDocuments({ action: 'redirected-to-form' });
      const dismissals = await Feedback.countDocuments({ action: 'dismissed' });
      const conversionRate = totalFeedback > 0 ? ((conversions / totalFeedback) * 100).toFixed(2) : 0;

      return {
        totalFeedback,
        feedbackBySource,
        feedbackByAction,
        conversions,
        dismissals,
        conversionRate,
      };
    } catch (error) {
      console.error('[FeedbackService] Error getting analytics:', error.message);
      throw error;
    }
  }

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
      const feedbackAnalytics = await this.getFeedbackAnalytics();
      const sessionAnalytics = await this.getSessionAnalytics();
      const pageViewAnalytics = await this.getPageViewAnalytics();

      return {
        feedback: feedbackAnalytics,
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
