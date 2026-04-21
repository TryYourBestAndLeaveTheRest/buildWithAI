const mongoose = require('mongoose');
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
    async getHomeData({ page = 1 } = {}) {
        const [haveResult, needResult] = await Promise.all([
            Listing.getByType('have', { page, limit: 12 }),
            Listing.getByType('need', { page, limit: 12 })
        ]);
        return {
            listings: haveResult.items,
            requests: needResult.items,
            havePagination: {
                page: haveResult.page,
                totalPages: haveResult.totalPages,
                total: haveResult.total
            },
            needPagination: {
                page: needResult.page,
                totalPages: needResult.totalPages,
                total: needResult.total
            }
        };
    },

    async addListing(listingData) {
        const listing = new Listing(listingData);
        return await listing.save();
    },

    async startBargaining(listingId, actorId, action, comment = '') {
        // Use a MongoDB session for atomicity if replica set is available.
        // Falls back gracefully if sessions are not supported (standalone MongoDB).
        let session;
        try {
            session = await mongoose.startSession();
        } catch (err) {
            session = null;
        }

        const run = async (sess) => {
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
                transactionPayload.comments = [{ author: actorId, text: trimmedComment }];
            }

            let transaction;
            if (sess) {
                [transaction] = await Transaction.create([transactionPayload], { session: sess });
            } else {
                [transaction] = await Transaction.create([transactionPayload]);
            }

            listing.status = 'bargaining';
            listing.activeBargainer = actorId;
            
            if (sess) {
                await listing.save({ session: sess });
            } else {
                await listing.save();
            }

            return transaction;
        };

        if (session) {
            try {
                session.startTransaction();
                const result = await run(session);
                await session.commitTransaction();
                return result;
            } catch (err) {
                await session.abortTransaction();
                throw err;
            } finally {
                session.endSession();
            }
        } else {
            return run(null);
        }
    }
};

module.exports = ListingService;
