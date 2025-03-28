const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { JWT_SECRET } = process.env;
const db = require('./database');

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

const setupPassport = () => {
  passport.use(new JwtStrategy(options, async (payload, done) => {
    try {
      const user = await db.one('SELECT * FROM users WHERE id = $1', [payload.id]);
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }));
};

module.exports = {
  setupPassport
}; 