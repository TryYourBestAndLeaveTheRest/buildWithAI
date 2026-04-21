const ListingService = require('../services/listingService');

const ListingController = {
    async renderHome(req, res) {
        try {
            const { listings, requests } = await ListingService.getHomeData();
            res.render('index', {
                title: 'Home',
                listings,
                requests,
                session: req.session
            });
        } catch (error) {
            console.error('Home render error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    async createListing(req, res) {
        try {
            await ListingService.addListing({
                ...req.body,
                user: req.session.userId
            });
            res.redirect('/');
        } catch (error) {
            console.error('Create listing error:', error);
            res.status(500).send('Error creating listing');
        }
    },

    async interactWithListing(req, res) {
        try {
            const { id } = req.params;
            const { action, comment } = req.body;

            await ListingService.startBargaining(id, req.session.userId, action, comment || '');
            res.redirect('/');
        } catch (error) {
            console.error('Listing interaction error:', error);
            res.status(400).send(error.message || 'Unable to start bargaining');
        }
    }
};

module.exports = ListingController;
