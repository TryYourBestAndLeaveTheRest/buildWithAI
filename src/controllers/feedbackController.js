const FeedbackService = require('../services/feedbackService');

class FeedbackController {

  /**
   * Render admin dashboard
   */
  async renderAdminDashboard(req, res) {
    try {
      const metrics = await FeedbackService.getDashboardMetrics();
      
      res.render('admin', {
        title: 'Admin Dashboard',
        metrics,
      });
    } catch (error) {
      console.error('[FeedbackController] Error rendering admin dashboard:', error.message);
      res.status(500).render('error', {
        title: 'Error',
        statusCode: 500,
        message: error.message || 'Failed to load dashboard',
      });
    }
  }

  /**
   * Get feedback data as JSON (for API calls)
   */
  async getFeedbackData(req, res) {
    try {
      const analytics = await FeedbackService.getFeedbackAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('[FeedbackController] Error fetching feedback data:', error.message);
      res.status(500).json({ error: 'Failed to fetch feedback data' });
    }
  }

  /**
   * Get session data as JSON (for API calls)
   */
  async getSessionData(req, res) {
    try {
      const analytics = await FeedbackService.getSessionAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('[FeedbackController] Error fetching session data:', error.message);
      res.status(500).json({ error: 'Failed to fetch session data' });
    }
  }

  /**
   * Get page view data as JSON (for API calls)
   */
  async getPageViewData(req, res) {
    try {
      const analytics = await FeedbackService.getPageViewAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('[FeedbackController] Error fetching page view data:', error.message);
      res.status(500).json({ error: 'Failed to fetch page view data' });
    }
  }
}

module.exports = new FeedbackController();
