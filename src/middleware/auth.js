const jwt = require('jsonwebtoken');
const db = require('../db');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [user] = await db.query(
      'SELECT id, name, email, preferred_language, notification_preferences FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
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
    const { rows } = await db.query(
      'SELECT id, email, name, role FROM users WHERE id = ?',
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
  authenticate,
  adminAuth,
}; 