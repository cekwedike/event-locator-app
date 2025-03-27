const express = require('express');
const { body, query } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  getUserPreferences,
  updateUserPreferences,
  getFavoriteEvents,
  addFavoriteEvent,
  removeFavoriteEvent
} = require('../controllers/userController');

const router = express.Router();

// Validation middleware
const preferencesValidation = [
  body('preferredCategories').optional().isArray().withMessage('Preferred categories must be an array'),
  body('maxDistance').optional().isInt({ min: 1 }).withMessage('Max distance must be a positive number'),
  body('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  body('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  body('notificationEnabled').optional().isBoolean().withMessage('Notification enabled must be a boolean'),
  body('emailNotifications').optional().isBoolean().withMessage('Email notifications must be a boolean'),
  body('pushNotifications').optional().isBoolean().withMessage('Push notifications must be a boolean')
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Routes
router.get('/preferences', authenticate, getUserPreferences);
router.put('/preferences', authenticate, preferencesValidation, updateUserPreferences);
router.get('/favorites', authenticate, paginationValidation, getFavoriteEvents);
router.post('/favorites/:eventId', authenticate, addFavoriteEvent);
router.delete('/favorites/:eventId', authenticate, removeFavoriteEvent);

module.exports = router; 