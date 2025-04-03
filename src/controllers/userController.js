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

    // Try to create user preferences
    try {
      await pool.query(
        `INSERT INTO user_preferences (user_id)
         VALUES ($1)`,
        [user.id]
      );
    } catch (error) {
      logger.warn('Error creating user preferences:', error);
      // Continue even if preferences table doesn't exist
    }

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

    // Try to clear cache
    try {
      await deleteCache(`user_preferences:${userId}`);
      await deleteCache(`user_profile:${userId}`);
    } catch (error) {
      logger.warn('Cache error in updatePreferences:', error);
    }

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

    // Try to clear cache
    try {
      await deleteCache(`user_location:${userId}`);
      await deleteCache(`user_profile:${userId}`);
    } catch (error) {
      logger.warn('Cache error in updateLocation:', error);
    }

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
    logger.info(`Getting profile for user ${userId}`);

    // First check if user exists and get basic profile
    const userResult = await pool.query(
      `SELECT 
        id, 
        email, 
        name, 
        preferred_language,
        CASE 
          WHEN location IS NOT NULL THEN ST_X(location::geometry)
          ELSE NULL
        END as longitude,
        CASE 
          WHEN location IS NOT NULL THEN ST_Y(location::geometry)
          ELSE NULL
        END as latitude
      FROM users 
      WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      logger.warn(`User ${userId} not found in database`);
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const profile = userResult.rows[0];

    // Try to get preferences
    try {
      const prefResult = await pool.query(
        `SELECT 
          notification_preferences,
          notification_radius,
          notification_enabled,
          theme,
          preferred_categories
        FROM user_preferences 
        WHERE user_id = $1`,
        [userId]
      );

      if (prefResult.rows.length > 0) {
        Object.assign(profile, prefResult.rows[0]);
      }
    } catch (error) {
      logger.warn(`Error getting preferences for user ${userId}:`, error);
      // Continue with default values if preferences table doesn't exist
    }

    // Set default values for preferences
    const finalProfile = {
      ...profile,
      notification_preferences: profile.notification_preferences || { email: true, push: true },
      notification_radius: profile.notification_radius || 10,
      notification_enabled: profile.notification_enabled === null ? true : profile.notification_enabled,
      theme: profile.theme || 'light',
      preferred_categories: profile.preferred_categories || []
    };

    // Try to cache the profile
    try {
      await setCache(`user_profile:${userId}`, finalProfile);
      logger.info('Profile cached successfully');
    } catch (error) {
      logger.warn('Cache error in getProfile:', error);
    }

    res.json({
      status: 'success',
      data: finalProfile,
    });
  } catch (error) {
    logger.error('Get profile error:', error.message);
    logger.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Error getting profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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