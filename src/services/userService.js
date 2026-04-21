const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const UserService = {
    async registerUser(userData) {
        // Business logic for registration
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            throw new Error('User already exists');
        }
        return await User.create(userData);
    },

    async loginUser(email, password) {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }

        return user;
    },

    async getUserById(userId) {
        return await User.findById(userId);
    },

    async getUserProfile() {
        // Get the first user for the current simple dashboard
        return await User.find().sort({ createdAt: -1 }).limit(1);
    }
};

module.exports = UserService;
