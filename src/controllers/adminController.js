const AdminAnalyticsService = require('../services/adminAnalyticsService');

class AdminController {
  async renderDashboard(req, res) {
    try {
      const metrics = await AdminAnalyticsService.getDashboardMetrics();
      return res.render('admin', {
        title: 'Admin Dashboard',
        metrics,
      });
    } catch (error) {
      console.error('[AdminController] Error rendering admin dashboard:', error.message);
      return res.status(500).render('error', {
        title: 'Error 500',
        statusCode: 500,
        message: error.message || 'Failed to load dashboard',
      });
    }
  }

  async getSessionData(req, res) {
    try {
      const analytics = await AdminAnalyticsService.getSessionAnalytics();
      return res.json(analytics);
    } catch (error) {
      console.error('[AdminController] Error fetching session analytics:', error.message);
      return res.status(500).json({ error: 'Failed to fetch session analytics' });
    }
  }

  async getPageViewData(req, res) {
    try {
      const analytics = await AdminAnalyticsService.getPageViewAnalytics();
      return res.json(analytics);
    } catch (error) {
      console.error('[AdminController] Error fetching page view analytics:', error.message);
      return res.status(500).json({ error: 'Failed to fetch page view analytics' });
    }
  }
}

module.exports = new AdminController();