const mongoose = require('mongoose');
const Transaction = require('../models/transactionModel');
const Listing = require('../models/listingModel');
const NotificationService = require('./notificationService');

const TransactionService = {
    async getById(transactionId, userId) {
        const tx = await Transaction.findById(transactionId)
            .populate('listing', 'title type status dorm price')
            .populate('buyer', 'name dorm phone')
            .populate('seller', 'name dorm phone')
            .populate('comments.author', 'name')
            .lean();

        if (!tx) {
            const err = new Error('Transaction not found');
            err.status = 404;
            throw err;
        }

        // Only buyer or seller may view
        const isBuyer = String(tx.buyer._id) === String(userId);
        const isSeller = String(tx.seller._id) === String(userId);
        if (!isBuyer && !isSeller) {
            const err = new Error('You do not have access to this transaction');
            err.status = 403;
            throw err;
        }

        return { tx, isBuyer, isSeller };
    },

    async addComment(transactionId, userId, text) {
        const tx = await Transaction.findById(transactionId);
        if (!tx) throw Object.assign(new Error('Transaction not found'), { status: 404 });

        const isBuyer = String(tx.buyer) === String(userId);
        const isSeller = String(tx.seller) === String(userId);
        if (!isBuyer && !isSeller) {
            throw Object.assign(new Error('Not authorised'), { status: 403 });
        }

        if (!['pending', 'agreed'].includes(tx.status)) {
            throw Object.assign(new Error('Cannot comment on a closed transaction'), { status: 400 });
        }

        tx.comments.push({ author: userId, text: text.trim() });
        await tx.save();
        return tx;
    },

    async accept(transactionId, userId, comment) {
        const session = await mongoose.startSession().catch(() => null);

        const run = async (sess) => {
            const opts = sess ? { session: sess } : {};
            const tx = await Transaction.findById(transactionId).session(sess || null);
            if (!tx) throw Object.assign(new Error('Transaction not found'), { status: 404 });

            if (String(tx.seller) !== String(userId)) {
                throw Object.assign(new Error('Only the seller can accept this offer'), { status: 403 });
            }
            if (tx.status !== 'pending') {
                throw Object.assign(new Error('This transaction cannot be accepted in its current state'), { status: 400 });
            }

            tx.status = 'agreed';
            if (comment && comment.trim()) {
                tx.comments.push({ author: userId, text: comment.trim() });
            }
            await tx.save(opts);

            await Listing.findByIdAndUpdate(tx.listing, { status: 'agreed' }, opts);

            await NotificationService.notify(tx.buyer, 'offer_accepted', tx._id, tx.listing);
            return tx;
        };

        return _withSession(session, run);
    },

    async decline(transactionId, userId, comment) {
        const session = await mongoose.startSession().catch(() => null);

        const run = async (sess) => {
            const opts = sess ? { session: sess } : {};
            const tx = await Transaction.findById(transactionId).session(sess || null);
            if (!tx) throw Object.assign(new Error('Transaction not found'), { status: 404 });

            if (String(tx.seller) !== String(userId)) {
                throw Object.assign(new Error('Only the seller can decline this offer'), { status: 403 });
            }
            if (tx.status !== 'pending') {
                throw Object.assign(new Error('This transaction cannot be declined in its current state'), { status: 400 });
            }

            tx.status = 'canceled';
            if (comment && comment.trim()) {
                tx.comments.push({ author: userId, text: `Declined: ${comment.trim()}` });
            }
            await tx.save(opts);

            // Revert listing back to active so others can bargain
            await Listing.findByIdAndUpdate(
                tx.listing,
                { status: 'active', activeBargainer: null },
                opts
            );

            await NotificationService.notify(tx.buyer, 'offer_declined', tx._id, tx.listing);
            return tx;
        };

        return _withSession(session, run);
    },

    async complete(transactionId, userId, comment) {
        const tx = await Transaction.findById(transactionId);
        if (!tx) throw Object.assign(new Error('Transaction not found'), { status: 404 });

        const isBuyer = String(tx.buyer) === String(userId);
        const isSeller = String(tx.seller) === String(userId);
        if (!isBuyer && !isSeller) {
            throw Object.assign(new Error('Not authorised'), { status: 403 });
        }
        if (tx.status !== 'agreed') {
            throw Object.assign(new Error('Transaction must be agreed before it can be completed'), { status: 400 });
        }

        tx.status = 'completed';
        if (comment && comment.trim()) {
            tx.comments.push({ author: userId, text: comment.trim() });
        }
        await tx.save();

        await Listing.findByIdAndUpdate(tx.listing, { status: 'completed' });

        const otherParty = isBuyer ? tx.seller : tx.buyer;
        await NotificationService.notify(otherParty, 'completed', tx._id, tx.listing);
        return tx;
    },

    async cancel(transactionId, userId, comment) {
        const session = await mongoose.startSession().catch(() => null);

        const run = async (sess) => {
            const opts = sess ? { session: sess } : {};
            const tx = await Transaction.findById(transactionId).session(sess || null);
            if (!tx) throw Object.assign(new Error('Transaction not found'), { status: 404 });

            const isBuyer = String(tx.buyer) === String(userId);
            const isSeller = String(tx.seller) === String(userId);
            if (!isBuyer && !isSeller) {
                throw Object.assign(new Error('Not authorised'), { status: 403 });
            }
            if (['completed', 'canceled'].includes(tx.status)) {
                throw Object.assign(new Error('Transaction is already closed'), { status: 400 });
            }

            tx.status = 'canceled';
            const reason = comment && comment.trim() ? comment.trim() : 'No reason given';
            tx.comments.push({ author: userId, text: `Canceled: ${reason}` });
            await tx.save(opts);

            // Only revert to active if it was still in bargaining/pending
            if (['pending', 'agreed'].includes(tx.status)) {
                await Listing.findByIdAndUpdate(
                    tx.listing,
                    { status: 'active', activeBargainer: null },
                    opts
                );
            } else {
                await Listing.findByIdAndUpdate(tx.listing, { status: 'active', activeBargainer: null }, opts);
            }

            const otherParty = isBuyer ? tx.seller : tx.buyer;
            await NotificationService.notify(otherParty, 'canceled', tx._id, tx.listing);
            return tx;
        };

        return _withSession(session, run);
    }
};

async function _withSession(session, fn) {
    if (session) {
        try {
            session.startTransaction();
            const result = await fn(session);
            await session.commitTransaction();
            return result;
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }
    return fn(null);
}

module.exports = TransactionService;
