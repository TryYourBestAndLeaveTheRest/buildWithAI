const ListingService = require('../services/listingService');

const ListingController = {
    async renderHome(req, res) {
        try {
            const { listings, requests } = await ListingService.getHomeData();
            res.render('index', { 
                title: 'Home', 
                listings, 
                requests 
            });
        } catch (error) {
            console.error('Home render error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    async createListing(req, res) {
        try {
            await ListingService.addListing(req.body);
            res.redirect('/');
        } catch (error) {
            console.error('Create listing error:', error);
            res.status(500).send('Error creating listing');
        }
    }
};

module.exports = ListingController;
