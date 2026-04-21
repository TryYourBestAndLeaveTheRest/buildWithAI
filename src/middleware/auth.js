const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  console.warn('Unauthorized access attempt', {
    path: req.originalUrl,
    sessionId: req.sessionID,
    userId: req.session && req.session.userId ? String(req.session.userId) : null
  });
  return res.redirect('/login');
};

const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  return next();
};

module.exports = {
  requireAuth,
  redirectIfAuthenticated
};