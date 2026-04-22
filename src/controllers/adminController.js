const AdminAnalyticsService = require('../services/adminAnalyticsService');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const Listing = require('../models/listingModel');

class AdminController {
  renderDashboard = async (req, res) => {
    try {
      const metrics = await AdminAnalyticsService.getDashboardMetrics();
      
      // Default view for data management
      const initialResource = 'users';
      const { items: users, total } = await this._fetchData('users', { page: 1, limit: 10 });

      return res.render('admin', {
        title: 'Admin Dashboard',
        metrics,
        initialData: {
          resource: initialResource,
          items: users,
          total,
          page: 1,
          limit: 10
        }
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

  getSessionData = async (req, res) => {
    try {
      const analytics = await AdminAnalyticsService.getSessionAnalytics();
      return res.json(analytics);
    } catch (error) {
      console.error('[AdminController] Error fetching session analytics:', error.message);
      return res.status(500).json({ error: 'Failed to fetch session analytics' });
    }
  }

  getPageViewData = async (req, res) => {
    try {
      const analytics = await AdminAnalyticsService.getPageViewAnalytics();
      return res.json(analytics);
    } catch (error) {
      console.error('[AdminController] Error fetching page view analytics:', error.message);
      return res.status(500).json({ error: 'Failed to fetch page view analytics' });
    }
  }

  getDataList = async (req, res) => {
    try {
      const { resource } = req.params;
      const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc', filter = '{}' } = req.query;

      const result = await this._fetchData(resource, {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        sortBy,
        order,
        filter: JSON.parse(filter)
      });

      return res.json(result);
    } catch (error) {
      console.error(`[AdminController] Error fetching ${req.params.resource} list:`, error.message);
      return res.status(500).json({ error: `Failed to fetch ${req.params.resource} list` });
    }
  }

  _fetchData = async (resource, options) => {
    const { page, limit, search, sortBy, order, filter } = options;
    const skip = (page - 1) * limit;
    let model;
    let searchFields = [];
    let populate = [];

    switch (resource) {
      case 'users':
        model = User;
        searchFields = ['name', 'email', 'dorm'];
        break;
      case 'listings':
        model = Listing;
        searchFields = ['title', 'description', 'dorm'];
        populate = [{ path: 'user', select: 'name' }];
        break;
      case 'transactions':
        model = Transaction;
        searchFields = ['status'];
        populate = [
          { path: 'buyer', select: 'name' },
          { path: 'seller', select: 'name' },
          { path: 'listing', select: 'title' }
        ];
        break;
      default:
        throw new Error('Invalid resource type');
    }

    const query = { ...filter };
    if (search && searchFields.length > 0) {
      query.$or = searchFields.map(field => ({
        [field]: { $regex: search, $options: 'i' }
      }));
    }

    const [items, total] = await Promise.all([
      model.find(query)
        .populate(populate)
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit),
      model.countDocuments(query)
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}

module.exports = new AdminController();