const UserService = require('../services/userService');

const UserController = {
    renderRegister(req, res) {
        res.render('register', { title: 'Register' });
    },

    async handleRegister(req, res) {
        try {
            await UserService.registerUser(req.body);
            res.redirect('/');
        } catch (error) {
            console.error('Registration error:', error);
            res.status(400).send(error.message);
        }
    },

    async renderDashboard(req, res) {
        try {
            const user = await UserService.getUserProfile();
            res.render('dashboard', { title: 'My Dashboard', user });
        } catch (error) {
            console.error('Dashboard render error:', error);
            res.status(500).send('Internal Server Error');
        }
    }
};

module.exports = UserController;
