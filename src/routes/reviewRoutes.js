const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { isAuthenticated } = require('../middleware/auth');
const {
  getEventReviews,
  createReview,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');

// Validation middleware
const reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters')
];

// Public routes
router.get('/event/:eventId', getEventReviews);

// Protected routes
router.post('/event/:eventId', isAuthenticated, reviewValidation, createReview);
router.put('/:id', isAuthenticated, reviewValidation, updateReview);
router.delete('/:id', isAuthenticated, deleteReview);

module.exports = router;