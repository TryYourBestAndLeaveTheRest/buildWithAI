const express = require('express');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const mainRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');
const feedbackRoutes = require('./routes/feedback');
const errorHandler = require('./middleware/errorHandler');
const { analyticsMiddleware } = require('./middleware/analytics');
const NotificationService = require('./services/notificationService');

// Load env vars early
require('dotenv').config();

// Connect to database
connectDB();

const app = express();
app.set('trust proxy', 1);

// Security & Performance Middleware
// Note: 'unsafe-inline' is removed from scriptSrc/scriptSrcAttr.
// All JS lives in /public/js/ static files.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(compression());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again later'
});
app.use('/login', authLimiter);
app.use('/register', authLimiter);

// EJS Setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Static folder
app.use(express.static(path.join(__dirname, '../public')));

// Session configuration
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === 'production') {
  console.error('CRITICAL: SESSION_SECRET is not set in production!');
  process.exit(1);
}

app.use(
  session({
    secret: sessionSecret || 'dev_secret_only',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days
    }
  })
);

// Analytics middleware - track page views and session data
app.use(analyticsMiddleware);

// Shared auth state + unread notification count for all EJS views
app.use(async (req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.query = req.query;
  res.locals.feedbackFormUrl = process.env.FEEDBACK_FORM_URL || 'https://forms.google.com/YOUR-FORM-ID';
  res.locals.isAuthenticated = Boolean(req.session && req.session.userId);
  res.locals.isAdmin = req.session?.isAdmin || false;
  res.locals.currentUser = req.session && req.session.userId
    ? {
        id: req.session.userId,
        name: req.session.userName || '',
        isAdmin: req.session.isAdmin || false
      }
    : null;

  // Unread notification badge count
  res.locals.unreadCount = 0;
  if (res.locals.isAuthenticated) {
    res.locals.unreadCount = await NotificationService.countUnread(req.session.userId);
  }

  res.locals.navItems = res.locals.isAuthenticated
    ? [
        { label: 'Feed', href: '/' },
        { label: 'Dashboard', href: '/dashboard' }
      ]
    : [
        { label: 'Feed', href: '/' }
      ];

  res.locals.authActions = res.locals.isAuthenticated
    ? [
        { label: 'Logout', href: '/logout', variant: 'danger' }
      ]
    : [
        { label: 'Access', href: '/login', variant: 'primary' },
        { label: 'Join Hub', href: '/register', variant: 'primary' }
      ];

  next();
});

// Routes
app.use('/', mainRoutes);
app.use('/', adminRoutes);
app.use('/', feedbackRoutes);

// 404 handler — must be after all routes
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Not Found',
    statusCode: 404,
    message: 'The page or resource you were looking for does not exist.'
  });
});

// Centralized error handler (must be last)
app.use(errorHandler);

// Export app
module.exports = app;
