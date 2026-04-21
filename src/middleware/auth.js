/**
 * requireAuth — blocks unauthenticated users, redirects to /login.
 */
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  console.warn('[Auth] Unauthorized access attempt', {
    path: req.originalUrl,
    sessionId: req.sessionID
  });
  return res.redirect('/login');
};

/**
 * optionalAuth — always proceeds. Sets session info in res.locals if logged in.
 * Use for routes that are public but adapt their UI for authenticated users.
 */
const optionalAuth = (req, res, next) => {
  // res.locals are already set by the global middleware in app.js — just pass through.
  return next();
};

/**
 * redirectIfAuthenticated — sends already-logged-in users away from auth pages.
 */
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  return next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  redirectIfAuthenticated
};