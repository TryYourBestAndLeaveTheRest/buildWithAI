const { PageView, SessionAnalytics } = require('../models/analyticsModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const Listing = require('../models/listingModel');

class AdminAnalyticsService {
  async getSessionAnalytics() {
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
  }

  async getPageViewAnalytics() {
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
  }

  async getUserAnalytics() {
    const totalUsers = await User.countDocuments();
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newUsersLast24 = await User.countDocuments({ createdAt: { $gte: last24Hours } });
    
    const dormDistribution = await User.aggregate([
      { $group: { _id: '$dorm', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return {
      totalUsers,
      newUsersLast24,
      dormDistribution
    };
  }

  async getTransactionAnalytics() {
    const totalTransactions = await Transaction.countDocuments();
    const statusDistribution = await Transaction.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newTransactionsLast24 = await Transaction.countDocuments({ createdAt: { $gte: last24Hours } });

    return {
      totalTransactions,
      statusDistribution,
      newTransactionsLast24
    };
  }

  async getListingAnalytics() {
    const totalListings = await Listing.countDocuments();
    const typeDistribution = await Listing.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    const statusDistribution = await Listing.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return {
      totalListings,
      typeDistribution,
      statusDistribution
    };
  }

  async getDashboardMetrics() {
    const [sessions, pageViews, users, transactions, listings] = await Promise.all([
      this.getSessionAnalytics(),
      this.getPageViewAnalytics(),
      this.getUserAnalytics(),
      this.getTransactionAnalytics(),
      this.getListingAnalytics()
    ]);

    return {
      sessions,
      pageViews,
      users,
      transactions,
      listings
    };
  }
}

module.exports = new AdminAnalyticsService();