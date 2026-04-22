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
 * requireAdmin — requires admin privileges (isAdmin = true).
 */
const requireAdmin = (req, res, next) => {
  if (req.session && req.session.userId && req.session.isAdmin === true) {
    return next();
  }
  console.warn('[Auth] Unauthorized admin access attempt', {
    path: req.originalUrl,
    sessionId: req.sessionID,
    userId: req.session?.userId,
  });
  return res.status(403).render('error', {
    title: 'Access Denied',
    statusCode: 403,
    message: 'You do not have permission to access this resource.',
  });
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
  requireAdmin,
  optionalAuth,
  redirectIfAuthenticated
};