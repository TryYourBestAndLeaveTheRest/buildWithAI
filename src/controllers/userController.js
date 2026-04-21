const UserService = require('../services/userService');

const UserController = {
    renderRegister(req, res) {
        res.render('register', { title: 'Register' });
    },

    async handleRegister(req, res) {
        try {
            const user = await UserService.registerUser(req.body);
            req.session.userId = user._id;
            res.redirect('/');
        } catch (error) {
            console.error('Registration error:', error);
            res.status(400).json({ success: false, error: error.message });
        }
    },

    renderLogin(req, res) {
        res.render('login', { title: 'Login', error: null });
    },

    async handleLogin(req, res) {
        try {
            const { email, password } = req.body;
            const user = await UserService.loginUser(email, password);
            
            // Store user ID in session
            req.session.userId = user._id;
            req.session.userName = user.name;
            
            res.redirect('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            res.status(401).render('login', { 
                title: 'Login', 
                error: error.message 
            });
        }
    },

    async renderDashboard(req, res) {
        try {
            if (!req.session.userId) {
                return res.redirect('/login');
            }
            const user = await UserService.getUserById(req.session.userId);
            res.render('dashboard', { title: 'My Dashboard', user });
        } catch (error) {
            console.error('Dashboard render error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).json({ success: false, error: 'Logout failed' });
            }
            res.redirect('/');
        });
    }
};

module.exports = UserController;
