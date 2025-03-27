const passport = require('passport');
const { UnauthorizedError } = require('../utils/errors');

const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new UnauthorizedError(info?.message || 'Authentication failed'));
    }
    req.user = user;
    next();
  })(req, res, next);
};

const isAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return next(new UnauthorizedError('Admin access required'));
  }
  next();
};

module.exports = {
  authenticate,
  isAdmin
}; 