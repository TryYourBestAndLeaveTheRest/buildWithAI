const Listing = require('../models/listingModel');

const ListingService = {
    async getHomeData() {
        const listings = await Listing.getByType('have');
        const requests = await Listing.getByType('need');
        return { listings, requests };
    },

    async addListing(listingData) {
        // Here we could add validation, sanitization, etc.
        return await Listing.create(listingData);
    }
};

module.exports = ListingService;
