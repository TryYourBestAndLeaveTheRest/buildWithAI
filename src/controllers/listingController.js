const ListingService = require('../services/listingService');

const ListingController = {
    async renderHome(req, res, next) {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const data = await ListingService.getHomeData({ page });
            res.render('index', {
                title: 'Feed',
                ...data,
                session: req.session
            });
        } catch (error) {
            next(error);
        }
    },

    async createListing(req, res, next) {
        try {
            await ListingService.addListing({
                ...req.body,
                user: req.session.userId
            });
            res.redirect('/');
        } catch (error) {
            next(error);
        }
    },

    async interactWithListing(req, res, next) {
        try {
            const { id } = req.params;
            const { action, comment } = req.body;
            const transaction = await ListingService.startBargaining(
                id,
                req.session.userId,
                action,
                comment || ''
            );

            // Trigger a notification to the listing owner (seller)
            const NotificationService = require('../services/notificationService');
            const Listing = require('../models/listingModel');
            const listing = await Listing.findById(id).lean();

            if (listing) {
                await NotificationService.notify(
                    listing.user,
                    'new_offer',
                    transaction._id,
                    listing._id
                );
            }

            res.redirect(`/transactions/${transaction._id}`);
        } catch (error) {
            // If it's a known user-error, pass it to the error handler with a 400 status
            if (!error.status) error.status = 400;
            next(error);
        }
    }
};

module.exports = ListingController;
