const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { getCache, setCache, deleteCache } = require('../config/redis');
const { publishMessage } = require('../config/rabbitmq');
const logger = require('../utils/logger');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const register = async (req, res) => {
  try {
    const { email, password, name, preferred_language } = req.body;

    // Check if user already exists
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, preferred_language)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, preferred_language`,
      [email, passwordHash, name, preferred_language]
    );

    const user = result.rows[0];

    // Create user preferences
    await pool.query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($1)`,
      [user.id]
    );

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      status: 'success',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating user',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user
    const { rows } = await pool.query(
      'SELECT id, email, password_hash, name, preferred_language FROM users WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    const user = rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user);

    // Remove password hash from response
    delete user.password_hash;

    res.json({
      status: 'success',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error logging in',
    });
  }
};

const updatePreferences = async (req, res) => {
  try {
    const { preferred_categories, notification_radius, notification_enabled } = req.body;
    const userId = req.user.id;

    // Update preferences
    await pool.query(
      `UPDATE user_preferences
       SET preferred_categories = COALESCE($1, preferred_categories),
           notification_radius = COALESCE($2, notification_radius),
           notification_enabled = COALESCE($3, notification_enabled),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4`,
      [preferred_categories, notification_radius, notification_enabled, userId]
    );

    // Clear cache for user preferences
    await deleteCache(`user_preferences:${userId}`);

    res.json({
      status: 'success',
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating preferences',
    });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.id;

    // Update location
    await pool.query(
      `UPDATE users
       SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [longitude, latitude, userId]
    );

    // Clear cache for user location
    await deleteCache(`user_location:${userId}`);

    res.json({
      status: 'success',
      message: 'Location updated successfully',
    });
  } catch (error) {
    logger.error('Update location error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating location',
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Try to get from cache first
    const cachedProfile = await getCache(`user_profile:${userId}`);
    if (cachedProfile) {
      return res.json({
        status: 'success',
        data: cachedProfile,
      });
    }

    // Get user profile with preferences
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.name, u.preferred_language,
              up.preferred_categories, up.notification_radius, up.notification_enabled,
              ST_X(u.location::geometry) as longitude,
              ST_Y(u.location::geometry) as latitude
       FROM users u
       LEFT JOIN user_preferences up ON u.id = up.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    const profile = rows[0];

    // Cache the profile
    await setCache(`user_profile:${userId}`, profile);

    res.json({
      status: 'success',
      data: profile,
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting profile',
    });
  }
};

module.exports = {
  register,
  login,
  updatePreferences,
  updateLocation,
  getProfile,
}; 