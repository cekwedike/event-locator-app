const express = require('express');
const { body, query } = require('express-validator');
const { authenticate, isAdmin } = require('../middleware/auth');
const {
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  searchEvents
} = require('../controllers/eventController');

const router = express.Router();

// Validation middleware
const eventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().optional(),
  body('location.latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location.longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be a positive number'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('categories').optional().isArray().withMessage('Categories must be an array')
];

const searchValidation = [
  query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  query('radius').optional().isFloat({ min: 0 }).withMessage('Radius must be a positive number'),
  query('categories').optional().isString().withMessage('Categories must be a comma-separated string'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Routes
router.post('/', authenticate, eventValidation, createEvent);
router.get('/:id', getEvent);
router.put('/:id', authenticate, eventValidation, updateEvent);
router.delete('/:id', authenticate, deleteEvent);
router.get('/', searchValidation, searchEvents);

module.exports = router; 