const UserService = require('../services/userService');
const { DORM_OPTIONS } = require('../config/registerOptions');

const UserController = {
    renderRegister(req, res) {
        res.render('register', {
            title: 'Register',
            session: req.session,
            error: null,
            dormOptions: DORM_OPTIONS,
            formData: {}
        });
    },

    async handleRegister(req, res, next) {
        try {
            const user = await UserService.registerUser(req.body);
            req.session.userId = user._id;
            req.session.userName = user.name;
            req.session.save(() => res.redirect('/'));
        } catch (error) {
            console.error('Registration error:', error);
            res.status(400).render('register', {
                title: 'Register',
                error: error.message,
                formData: req.body,
                session: req.session,
                dormOptions: DORM_OPTIONS
            });
        }
    },

    renderLogin(req, res) {
        res.render('login', { title: 'Login', error: null, session: req.session });
    },

    async handleLogin(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await UserService.loginUser(email, password);
            req.session.userId = user._id;
            req.session.userName = user.name;
            req.session.save(() => res.redirect('/dashboard'));
        } catch (error) {
            console.error('Login error:', error);
            res.status(401).render('login', {
                title: 'Login',
                error: error.message,
                session: req.session
            });
        }
    },

    async renderDashboard(req, res, next) {
        try {
            const userId = req.session.userId;
            const [user, dashData] = await Promise.all([
                UserService.getUserById(userId),
                UserService.getDashboardData(userId)
            ]);

            res.render('dashboard', {
                title: 'Dashboard',
                user,
                ...dashData,
                flash: req.query.flash || null,
                session: req.session
            });
        } catch (error) {
            next(error);
        }
    },

    async renderProfile(req, res, next) {
        try {
            const userId = req.session.userId;
            const [user, dashData] = await Promise.all([
                UserService.getUserById(userId),
                UserService.getDashboardData(userId)
            ]);

            res.render('dashboard', {
                title: 'My Profile',
                user,
                ...dashData,
                flash: null,
                session: req.session
            });
        } catch (error) {
            next(error);
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
