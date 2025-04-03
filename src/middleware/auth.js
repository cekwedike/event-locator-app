const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No authentication token provided');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const { rows } = await pool.query(
      'SELECT id, email, name, preferred_language FROM users WHERE id = $1',
      [decoded.id]
    );

    if (rows.length === 0) {
      throw new Error('User not found');
    }

    // Add user to request object
    req.user = rows[0];
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Please authenticate',
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No authentication token provided');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const { rows } = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (rows.length === 0) {
      throw new Error('User not found');
    }

    // Check if user is admin
    if (rows[0].role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Add user to request object
    req.user = rows[0];
    next();
  } catch (error) {
    logger.error('Admin authentication error:', error);
    res.status(403).json({
      status: 'error',
      message: 'Admin access required',
    });
  }
};

module.exports = {
  auth,
  adminAuth,
}; 