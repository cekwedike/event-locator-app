const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    const result = await pool.query(
      'SELECT id, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = result.rows[0];
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ accessToken, refreshToken });
  } catch (error) {
    logger.error('Error refreshing token:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    res.json({ message: 'Successfully logged out' });
  } catch (error) {
    logger.error('Error during logout:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // In a real application, you would:
    // 1. Generate a reset token
    // 2. Save it to the database with an expiration
    // 3. Send an email with the reset link

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    logger.error('Error in forgot password:', error);
    res.status(500).json({ message: 'Error processing request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // In a real application, you would:
    // 1. Verify the token
    // 2. Check if it's expired
    // 3. Update the password

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    logger.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

module.exports = {
  refreshToken,
  logout,
  changePassword,
  resetPassword,
  forgotPassword,
}; 