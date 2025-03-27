const { db } = require('../config/database');
const { validationResult } = require('express-validator');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

// Get reviews for an event
const getEventReviews = async (req, res, next) => {
  try {
    const reviews = await db.any(
      `SELECT r.*, u.username, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.eventId]
    );

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;

    res.json({
      reviews,
      averageRating: Number(avgRating.toFixed(1))
    });
  } catch (error) {
    next(error);
  }
};

// Create a new review
const createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Check if user has already reviewed this event
    const existingReview = await db.oneOrNone(
      'SELECT * FROM reviews WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    if (existingReview) {
      throw new ForbiddenError('You have already reviewed this event');
    }

    const review = await db.one(
      `INSERT INTO reviews (user_id, event_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, eventId, rating, comment]
    );

    // Get user info for the response
    const user = await db.one(
      'SELECT id, username, avatar_url FROM users WHERE id = $1',
      [userId]
    );

    res.status(201).json({
      message: req.t('reviews.create.success'),
      review: {
        ...review,
        user: {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update a review
const updateReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, comment } = req.body;
    const userId = req.user.id;
    const reviewId = req.params.id;

    // Check if review exists and belongs to user
    const existingReview = await db.oneOrNone(
      'SELECT * FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (!existingReview) {
      throw new NotFoundError(req.t('reviews.update.notFound'));
    }

    if (existingReview.user_id !== userId) {
      throw new ForbiddenError(req.t('reviews.update.unauthorized'));
    }

    const review = await db.one(
      `UPDATE reviews 
       SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [rating, comment, reviewId]
    );

    res.json({
      message: req.t('reviews.update.success'),
      review
    });
  } catch (error) {
    next(error);
  }
};

// Delete a review
const deleteReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;

    // Check if review exists and belongs to user
    const existingReview = await db.oneOrNone(
      'SELECT * FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (!existingReview) {
      throw new NotFoundError(req.t('reviews.delete.notFound'));
    }

    if (existingReview.user_id !== userId) {
      throw new ForbiddenError(req.t('reviews.delete.unauthorized'));
    }

    await db.result('DELETE FROM reviews WHERE id = $1', [reviewId]);

    res.json({
      message: req.t('reviews.delete.success')
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEventReviews,
  createReview,
  updateReview,
  deleteReview
}; 