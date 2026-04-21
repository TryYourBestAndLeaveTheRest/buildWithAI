const TransactionService = require('../services/transactionService');
const NotificationService = require('../services/notificationService');

const TransactionController = {
    async renderDetail(req, res, next) {
        try {
            const { id } = req.params;
            const { tx, isBuyer, isSeller } = await TransactionService.getById(id, req.session.userId);
            res.render('transaction', {
                title: `Transaction — ${tx.listing.title}`,
                tx,
                isBuyer,
                isSeller,
                session: req.session
            });
        } catch (err) {
            next(err);
        }
    },

    async handleAccept(req, res, next) {
        try {
            const { id } = req.params;
            const { comment } = req.body;
            await TransactionService.accept(id, req.session.userId, comment);
            res.redirect(`/transactions/${id}?flash=accepted`);
        } catch (err) {
            next(err);
        }
    },

    async handleDecline(req, res, next) {
        try {
            const { id } = req.params;
            const { comment } = req.body;
            await TransactionService.decline(id, req.session.userId, comment);
            res.redirect(`/?flash=declined`);
        } catch (err) {
            next(err);
        }
    },

    async handleComplete(req, res, next) {
        try {
            const { id } = req.params;
            const { comment } = req.body;
            await TransactionService.complete(id, req.session.userId, comment);
            res.redirect(`/transactions/${id}?flash=completed`);
        } catch (err) {
            next(err);
        }
    },

    async handleCancel(req, res, next) {
        try {
            const { id } = req.params;
            const { comment } = req.body;
            await TransactionService.cancel(id, req.session.userId, comment);
            res.redirect(`/dashboard?flash=canceled`);
        } catch (err) {
            next(err);
        }
    },

    async handleAddComment(req, res, next) {
        try {
            const { id } = req.params;
            const { comment } = req.body;
            if (!comment || !comment.trim()) {
                return res.redirect(`/transactions/${id}`);
            }
            await TransactionService.addComment(id, req.session.userId, comment);
            res.redirect(`/transactions/${id}`);
        } catch (err) {
            next(err);
        }
    },

    async renderNotifications(req, res, next) {
        try {
            const notifications = await NotificationService.getAndMarkRead(req.session.userId);
            res.render('notifications', {
                title: 'Notifications',
                notifications,
                session: req.session
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = TransactionController;
