const User = require('../models/userModel');

const UserService = {
    async registerUser(userData) {
        // Business logic for registration
        const existingUser = await User.getByEmail(userData.email);
        if (existingUser) {
            throw new Error('User already exists');
        }
        return await User.create(userData);
    },

    async getUserProfile() {
        // Get the first user for the current simple dashboard
        return await User.getFirst();
    }
};

module.exports = UserService;
