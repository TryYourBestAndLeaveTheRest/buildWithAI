const express = require('express');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const mainRoutes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

// Load env vars early
require('dotenv').config();

// Connect to database
connectDB();

const app = express();
app.set('trust proxy', 1);

// Security & Performance Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'self'", "'unsafe-inline'"],
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

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
      secure: 'auto',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days
    }
  })
);

// Shared auth state for all EJS views (layout/header and pages)
app.use((req, res, next) => {
  res.locals.isAuthenticated = Boolean(req.session && req.session.userId);
  res.locals.currentUser = req.session && req.session.userId
    ? {
        id: req.session.userId,
        name: req.session.userName || ''
      }
    : null;
  next();
});

// Routes
app.use('/', mainRoutes);

// Error Handler (must be after routes)
app.use(errorHandler);

// Export app
module.exports = app;
