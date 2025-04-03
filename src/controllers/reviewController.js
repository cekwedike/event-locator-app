const { pool } = require('../config/database');
const logger = require('../utils/logger');

const createReview = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Check if event exists
    const eventResult = await pool.query(
      'SELECT id FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user has already reviewed this event
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this event' });
    }

    const result = await pool.query(
      'INSERT INTO reviews (user_id, event_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, eventId, rating, comment]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating review:', error);
    res.status(500).json({ message: 'Error creating review' });
  }
};

const getEventReviews = async (req, res) => {
  try {
    const { eventId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if event exists
    const eventResult = await pool.query(
      'SELECT id FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const result = await pool.query(
      `SELECT r.*, u.name as user_name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.event_id = $1 
       ORDER BY r.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [eventId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM reviews WHERE event_id = $1',
      [eventId]
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      reviews: result.rows,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    logger.error('Error getting event reviews:', error);
    res.status(500).json({ message: 'Error getting event reviews' });
  }
};

const getReview = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.*, u.name as user_name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error getting review:', error);
    res.status(500).json({ message: 'Error getting review' });
  }
};

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Check if review exists and belongs to user
    const reviewResult = await pool.query(
      'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found or not authorized' });
    }

    const result = await pool.query(
      'UPDATE reviews SET rating = COALESCE($1, rating), comment = COALESCE($2, comment) WHERE id = $3 RETURNING *',
      [rating, comment, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating review:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if review exists and belongs to user
    const reviewResult = await pool.query(
      'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found or not authorized' });
    }

    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    logger.error('Error deleting review:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
};

module.exports = {
  createReview,
  getEventReviews,
  getReview,
  updateReview,
  deleteReview,
}; 