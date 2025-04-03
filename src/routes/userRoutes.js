const express = require('express');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { userSchemas } = require('../middleware/validation');
const {
  register,
  login,
  updatePreferences,
  updateLocation,
  getProfile,
} = require('../controllers/userController');

const router = express.Router();

// Public routes
router.post('/register', validate(userSchemas.register), register);
router.post('/login', validate(userSchemas.login), login);

// Protected routes
router.use(auth);
router.get('/profile', getProfile);
router.patch('/preferences', validate(userSchemas.updatePreferences), updatePreferences);
router.patch('/location', validate(userSchemas.updateLocation), updateLocation);

module.exports = router; 