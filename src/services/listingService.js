const Listing = require('../models/listingModel');
const Transaction = require('../models/transactionModel');

function deriveRoles(listing, actorId, action) {
    const ownerId = String(listing.user._id || listing.user);
    const currentId = String(actorId);

    if (ownerId === currentId) {
        throw new Error('You cannot interact with your own post');
    }

    if (listing.type === 'have' && action !== 'buy') {
        throw new Error('Invalid action for this post');
    }

    if (listing.type === 'need' && action !== 'provide') {
        throw new Error('Invalid action for this post');
    }

    if (listing.type === 'have') {
        return {
            buyer: actorId,
            seller: listing.user,
            initiatorRole: 'buyer'
        };
    }

    return {
        buyer: listing.user,
        seller: actorId,
        initiatorRole: 'seller'
    };
}

const ListingService = {
    async getHomeData() {
        const listings = await Listing.getByType('have');
        const requests = await Listing.getByType('need');
        return { listings, requests };
    },

    async addListing(listingData) {
        // Here we could add validation, sanitization, etc.
        return await Listing.create(listingData);
    },

    async startBargaining(listingId, actorId, action, comment = '') {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            throw new Error('Listing not found');
        }

        if (listing.status !== 'active') {
            throw new Error('This listing is not available for new bargaining');
        }

        const roles = deriveRoles(listing, actorId, action);

        const transactionPayload = {
            listing: listing._id,
            buyer: roles.buyer,
            seller: roles.seller,
            initiatorRole: roles.initiatorRole,
            status: 'pending'
        };

        const trimmedComment = comment.trim();
        if (trimmedComment) {
            transactionPayload.comments = [
                {
                    author: actorId,
                    text: trimmedComment
                }
            ];
        }

        const transaction = await Transaction.create(transactionPayload);

        listing.status = 'bargaining';
        listing.activeBargainer = actorId;
        await listing.save();

        return transaction;
    }
};

module.exports = ListingService;
