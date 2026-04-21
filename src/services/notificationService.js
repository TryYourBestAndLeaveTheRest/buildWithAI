const Notification = require('../models/notificationModel');

const MESSAGES = {
  new_offer: 'Someone wants to bargain on your listing',
  offer_accepted: 'Your offer has been accepted!',
  offer_declined: 'Your offer was declined. The listing is back to active.',
  completed: 'A transaction you were part of has been marked complete.',
  canceled: 'A transaction has been canceled.'
};

const NotificationService = {
  /**
   * Create a notification for a recipient.
   * Silently ignores errors so a notification failure never breaks the main flow.
   */
  async notify(recipientId, type, transactionId, listingId) {
    try {
      await Notification.create({
        recipient: recipientId,
        type,
        transaction: transactionId,
        listing: listingId
      });
    } catch (err) {
      console.error('[NotificationService] Failed to create notification:', err.message);
    }
  },

  /**
   * Count unread notifications for a user.
   */
  async countUnread(userId) {
    try {
      return await Notification.countDocuments({ recipient: userId, read: false });
    } catch {
      return 0;
    }
  },

  /**
   * Fetch all notifications for a user (most recent first).
   * Marks them all as read.
   */
  async getAndMarkRead(userId) {
    const notifications = await Notification.find({ recipient: userId })
      .populate('listing', 'title type')
      .populate('transaction', '_id')
      .sort({ createdAt: -1 })
      .lean();

    // Mark all unread as read asynchronously
    Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    ).catch((err) => console.error('[NotificationService] markRead failed:', err.message));

    return notifications.map((n) => ({
      ...n,
      message: MESSAGES[n.type] || n.type
    }));
  }
};

module.exports = NotificationService;
