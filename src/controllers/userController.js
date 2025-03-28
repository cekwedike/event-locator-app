const db = require('../config/database');
const { validationResult } = require('express-validator');
const { NotFoundError } = require('../utils/errors');

// Get user preferences
const getUserPreferences = async (req, res, next) => {
  try {
    const preferences = await db.oneOrNone(
      `SELECT up.*, 
              ST_AsGeoJSON(u.location) as location
       FROM user_preferences up
       JOIN users u ON up.user_id = u.id
       WHERE up.user_id = $1`,
      [req.user.id]
    );

    if (!preferences) {
      throw new NotFoundError('User preferences not found');
    }

    res.json({ preferences });
  } catch (error) {
    next(error);
  }
};

// Update user preferences
const updateUserPreferences = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      preferredCategories,
      maxDistance,
      minPrice,
      maxPrice,
      notificationEnabled,
      emailNotifications,
      pushNotifications
    } = req.body;

    const preferences = await db.one(
      `UPDATE user_preferences
       SET preferred_categories = $1,
           max_distance = $2,
           min_price = $3,
           max_price = $4,
           notification_enabled = $5,
           email_notifications = $6,
           push_notifications = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $8
       RETURNING *`,
      [
        preferredCategories,
        maxDistance,
        minPrice,
        maxPrice,
        notificationEnabled,
        emailNotifications,
        pushNotifications,
        req.user.id
      ]
    );

    res.json({
      message: req.t('user.preferences.update.success'),
      preferences
    });
  } catch (error) {
    next(error);
  }
};

// Get user's favorite events
const getFavoriteEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [events, total] = await Promise.all([
      db.any(
        `SELECT e.*, 
                ST_AsGeoJSON(e.location) as location,
                array_agg(DISTINCT c.id) as category_ids,
                array_agg(DISTINCT c.name) as category_names,
                COUNT(DISTINCT er.id) as rating_count,
                AVG(er.rating) as average_rating
         FROM favorite_events fe
         JOIN events e ON fe.event_id = e.id
         LEFT JOIN event_categories ec ON e.id = ec.event_id
         LEFT JOIN categories c ON ec.category_id = c.id
         LEFT JOIN event_ratings er ON e.id = er.event_id
         WHERE fe.user_id = $1
         GROUP BY e.id
         ORDER BY fe.created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      db.one(
        'SELECT COUNT(*) as total FROM favorite_events WHERE user_id = $1',
        [req.user.id]
      )
    ]);

    res.json({
      events,
      pagination: {
        total: parseInt(total.total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total.total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add event to favorites
const addFavoriteEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await db.oneOrNone('SELECT * FROM events WHERE id = $1', [eventId]);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Add to favorites
    await db.none(
      'INSERT INTO favorite_events (user_id, event_id) VALUES ($1, $2)',
      [req.user.id, eventId]
    );

    res.json({
      message: req.t('user.favorites.add.success')
    });
  } catch (error) {
    next(error);
  }
};

// Remove event from favorites
const removeFavoriteEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const result = await db.result(
      'DELETE FROM favorite_events WHERE user_id = $1 AND event_id = $2',
      [req.user.id, eventId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Favorite event not found');
    }

    res.json({
      message: req.t('user.favorites.remove.success')
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserPreferences,
  updateUserPreferences,
  getFavoriteEvents,
  addFavoriteEvent,
  removeFavoriteEvent
}; 