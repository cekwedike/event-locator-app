const { pool } = require('../config/database');
const { getCache, setCache, deleteCache } = require('../config/redis');
const { publishMessage } = require('../config/rabbitmq');
const logger = require('../utils/logger');
const { createReview: createEventReview } = require('./reviewController');

const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      latitude,
      longitude,
      start_time,
      end_time,
      category_id,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO events (
        title, description, location, start_time, end_time, 
        category_id, created_by
      ) VALUES (
        $1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8
      ) RETURNING *`,
      [title, description, longitude, latitude, start_time, end_time, category_id, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating event:', error);
    res.status(500).json({ message: 'Error creating event' });
  }
};

const getEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT e.*, 
        c.name as category_name,
        c.icon as category_icon,
        ST_X(e.location::geometry) as longitude,
        ST_Y(e.location::geometry) as latitude,
        (
          SELECT json_build_object(
            'average_rating', ROUND(AVG(r.rating)::numeric, 1),
            'total_reviews', COUNT(r.id)
          )
          FROM reviews r
          WHERE r.event_id = e.id
        ) as rating_info
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error getting event:', error);
    res.status(500).json({ message: 'Error getting event' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      latitude,
      longitude,
      start_time,
      end_time,
      category_id,
    } = req.body;

    // Check if event exists and user is authorized
    const eventResult = await pool.query(
      'SELECT created_by FROM events WHERE id = $1',
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (eventResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const result = await pool.query(
      `UPDATE events SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        location = COALESCE(ST_SetSRID(ST_MakePoint($3, $4), 4326), location),
        start_time = COALESCE($5, start_time),
        end_time = COALESCE($6, end_time),
        category_id = COALESCE($7, category_id)
      WHERE id = $8
      RETURNING *`,
      [title, description, longitude, latitude, start_time, end_time, category_id, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating event:', error);
    res.status(500).json({ message: 'Error updating event' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists and user is authorized
    const eventResult = await pool.query(
      'SELECT created_by FROM events WHERE id = $1',
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (eventResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await pool.query('DELETE FROM events WHERE id = $1', [id]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event' });
  }
};

const searchEvents = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 10,
      category_id,
      start_date,
      end_date,
    } = req.query;

    let query = `
      SELECT 
        e.*,
        c.name as category_name,
        c.icon as category_icon,
        ST_X(e.location::geometry) as longitude,
        ST_Y(e.location::geometry) as latitude,
        ST_Distance(
          e.location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance,
        (
          SELECT json_build_object(
            'average_rating', ROUND(AVG(r.rating)::numeric, 1),
            'total_reviews', COUNT(r.id)
          )
          FROM reviews r
          WHERE r.event_id = e.id
        ) as rating_info
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE ST_DWithin(
        e.location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3 * 1000
      )
    `;

    const queryParams = [longitude, latitude, radius];
    let paramCount = 4;

    if (category_id) {
      query += ` AND e.category_id = $${paramCount}`;
      queryParams.push(category_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND e.start_time >= $${paramCount}`;
      queryParams.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND e.end_time <= $${paramCount}`;
      queryParams.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY distance`;

    const result = await pool.query(query, queryParams);

    res.json(result.rows);
  } catch (error) {
    logger.error('Error searching events:', error);
    res.status(500).json({ message: 'Error searching events' });
  }
};

const rateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    
    // Create a mock request object with the necessary properties
    const mockReq = {
      params: { eventId: id },
      body: { rating, comment: review },
      user: req.user
    };
    
    // Create a mock response object to capture the response
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };
    
    // Call the review controller's createReview function
    await createEventReview(mockReq, mockRes);
    
    // Forward the response
    res.status(mockRes.statusCode).json(mockRes.data);
  } catch (error) {
    logger.error('Error rating event:', error);
    res.status(500).json({ message: 'Error rating event' });
  }
};

const saveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if event exists
    const eventResult = await pool.query(
      'SELECT id FROM events WHERE id = $1',
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is already saved
    const existingSave = await pool.query(
      'SELECT id FROM saved_events WHERE user_id = $1 AND event_id = $2',
      [userId, id]
    );

    if (existingSave.rows.length > 0) {
      return res.status(400).json({ message: 'Event already saved' });
    }

    await pool.query(
      'INSERT INTO saved_events (user_id, event_id) VALUES ($1, $2)',
      [userId, id]
    );

    res.json({ message: 'Event saved successfully' });
  } catch (error) {
    logger.error('Error saving event:', error);
    res.status(500).json({ message: 'Error saving event' });
  }
};

const getSavedEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT e.*, 
        c.name as category_name,
        c.icon as category_icon,
        ST_X(e.location::geometry) as longitude,
        ST_Y(e.location::geometry) as latitude,
        (
          SELECT json_build_object(
            'average_rating', ROUND(AVG(r.rating)::numeric, 1),
            'total_reviews', COUNT(r.id)
          )
          FROM reviews r
          WHERE r.event_id = e.id
        ) as rating_info
      FROM saved_events se
      JOIN events e ON se.event_id = e.id
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE se.user_id = $1
      ORDER BY se.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Error getting saved events:', error);
    res.status(500).json({ message: 'Error getting saved events' });
  }
};

module.exports = {
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  searchEvents,
  rateEvent,
  saveEvent,
  getSavedEvents,
}; 