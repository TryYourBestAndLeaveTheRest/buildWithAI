const User = require('../models/userModel');
const Listing = require('../models/listingModel');
const Transaction = require('../models/transactionModel');
const bcrypt = require('bcryptjs');

const UserService = {
    async registerUser(userData) {
        const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
        if (existingUser) {
            throw new Error('An account with this email already exists');
        }
        return await User.create(userData);
    },

    async loginUser(email, password) {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            throw new Error('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }

        return user;
    },

    async getUserById(userId) {
        return await User.findById(userId).lean();
    },

    async getDashboardData(userId) {
        const [myListings, offersReceived, offersSent] = await Promise.all([
            // All listings posted by this user
            Listing.find({ user: userId })
                .sort({ createdAt: -1 })
                .lean(),

            // Transactions where this user is the seller and someone bargained with them
            Transaction.find({ seller: userId })
                .populate('listing', 'title type status')
                .populate('buyer', 'name dorm')
                .sort({ updatedAt: -1 })
                .lean(),

            // Transactions this user initiated as a buyer
            Transaction.find({ buyer: userId })
                .populate('listing', 'title type status')
                .populate('seller', 'name dorm')
                .sort({ updatedAt: -1 })
                .lean(),
        ]);

        return { myListings, offersReceived, offersSent };
    }
};

module.exports = UserService;
