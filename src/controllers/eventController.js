const { pool } = require('../config/database');
const { getCache, setCache, deleteCache } = require('../config/redis');
const { publishMessage } = require('../config/rabbitmq');
const logger = require('../utils/logger');

const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      latitude,
      longitude,
      start_time,
      end_time,
      category,
    } = req.body;

    const userId = req.user.id;

    // Create event
    const { rows } = await pool.query(
      `INSERT INTO events (
        title, description, location, start_time, end_time, category, created_by
      )
      VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8)
      RETURNING id, title, description, start_time, end_time, category`,
      [title, description, longitude, latitude, start_time, end_time, category, userId]
    );

    const event = rows[0];

    // Publish event creation message
    await publishMessage('event_updates', {
      type: 'created',
      eventId: event.id,
      userId,
    });

    res.status(201).json({
      status: 'success',
      data: event,
    });
  } catch (error) {
    logger.error('Create event error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating event',
    });
  }
};

const getEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    // Try to get from cache first
    const cachedEvent = await getCache(`event:${eventId}`);
    if (cachedEvent) {
      return res.json({
        status: 'success',
        data: cachedEvent,
      });
    }

    // Get event with location
    const { rows } = await pool.query(
      `SELECT e.id, e.title, e.description, e.start_time, e.end_time, e.category,
              e.created_by, u.name as creator_name,
              ST_X(e.location::geometry) as longitude,
              ST_Y(e.location::geometry) as latitude,
              COALESCE(AVG(er.rating), 0) as average_rating,
              COUNT(er.id) as total_ratings
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       LEFT JOIN event_ratings er ON e.id = er.event_id
       WHERE e.id = $1
       GROUP BY e.id, u.name`,
      [eventId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found',
      });
    }

    const event = rows[0];

    // Cache the event
    await setCache(`event:${eventId}`, event);

    res.json({
      status: 'success',
      data: event,
    });
  } catch (error) {
    logger.error('Get event error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting event',
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const updates = req.body;

    // Check if event exists and user is creator
    const { rows } = await pool.query(
      'SELECT created_by FROM events WHERE id = $1',
      [eventId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found',
      });
    }

    if (rows[0].created_by !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this event',
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (updates.title) {
      updateFields.push(`title = $${paramCount}`);
      values.push(updates.title);
      paramCount++;
    }

    if (updates.description) {
      updateFields.push(`description = $${paramCount}`);
      values.push(updates.description);
      paramCount++;
    }

    if (updates.latitude && updates.longitude) {
      updateFields.push(`location = ST_SetSRID(ST_MakePoint($${paramCount}, $${paramCount + 1}), 4326)`);
      values.push(updates.longitude, updates.latitude);
      paramCount += 2;
    }

    if (updates.start_time) {
      updateFields.push(`start_time = $${paramCount}`);
      values.push(updates.start_time);
      paramCount++;
    }

    if (updates.end_time) {
      updateFields.push(`end_time = $${paramCount}`);
      values.push(updates.end_time);
      paramCount++;
    }

    if (updates.category) {
      updateFields.push(`category = $${paramCount}`);
      values.push(updates.category);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields to update',
      });
    }

    // Add updated_at and eventId to values
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(eventId);

    // Update event
    await pool.query(
      `UPDATE events
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}`,
      values
    );

    // Clear cache
    await deleteCache(`event:${eventId}`);

    // Publish event update message
    await publishMessage('event_updates', {
      type: 'updated',
      eventId,
      userId,
    });

    res.json({
      status: 'success',
      message: 'Event updated successfully',
    });
  } catch (error) {
    logger.error('Update event error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating event',
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Check if event exists and user is creator
    const { rows } = await pool.query(
      'SELECT created_by FROM events WHERE id = $1',
      [eventId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found',
      });
    }

    if (rows[0].created_by !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this event',
      });
    }

    // Delete event
    await pool.query('DELETE FROM events WHERE id = $1', [eventId]);

    // Clear cache
    await deleteCache(`event:${eventId}`);

    // Publish event deletion message
    await publishMessage('event_updates', {
      type: 'deleted',
      eventId,
      userId,
    });

    res.json({
      status: 'success',
      message: 'Event deleted successfully',
    });
  } catch (error) {
    logger.error('Delete event error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting event',
    });
  }
};

const searchEvents = async (req, res) => {
  try {
    const { latitude, longitude, radius, category, start_date, end_date } = req.body;

    // Build query dynamically
    const queryParams = [longitude, latitude, radius * 1000]; // Convert km to meters
    let paramCount = 4;
    let whereClauses = [
      `ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`
    ];

    if (category) {
      whereClauses.push(`category = $${paramCount}`);
      queryParams.push(category);
      paramCount++;
    }

    if (start_date) {
      whereClauses.push(`start_time >= $${paramCount}`);
      queryParams.push(start_date);
      paramCount++;
    }

    if (end_date) {
      whereClauses.push(`end_time <= $${paramCount}`);
      queryParams.push(end_date);
      paramCount++;
    }

    // Search events
    const { rows } = await pool.query(
      `SELECT e.id, e.title, e.description, e.start_time, e.end_time, e.category,
              e.created_by, u.name as creator_name,
              ST_X(e.location::geometry) as longitude,
              ST_Y(e.location::geometry) as latitude,
              COALESCE(AVG(er.rating), 0) as average_rating,
              COUNT(er.id) as total_ratings,
              ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       LEFT JOIN event_ratings er ON e.id = er.event_id
       WHERE ${whereClauses.join(' AND ')}
       GROUP BY e.id, u.name
       ORDER BY distance`,
      queryParams
    );

    res.json({
      status: 'success',
      data: rows,
    });
  } catch (error) {
    logger.error('Search events error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error searching events',
    });
  }
};

const rateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const { rating, review } = req.body;

    // Check if event exists
    const { rows } = await pool.query(
      'SELECT id FROM events WHERE id = $1',
      [eventId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found',
      });
    }

    // Add or update rating
    await pool.query(
      `INSERT INTO event_ratings (event_id, user_id, rating, review)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (event_id, user_id)
       DO UPDATE SET rating = $3, review = $4, created_at = CURRENT_TIMESTAMP`,
      [eventId, userId, rating, review]
    );

    // Clear cache
    await deleteCache(`event:${eventId}`);

    res.json({
      status: 'success',
      message: 'Event rated successfully',
    });
  } catch (error) {
    logger.error('Rate event error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error rating event',
    });
  }
};

const saveEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Check if event exists
    const { rows } = await pool.query(
      'SELECT id FROM events WHERE id = $1',
      [eventId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found',
      });
    }

    // Save event
    await pool.query(
      `INSERT INTO saved_events (user_id, event_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, eventId]
    );

    res.json({
      status: 'success',
      message: 'Event saved successfully',
    });
  } catch (error) {
    logger.error('Save event error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error saving event',
    });
  }
};

const getSavedEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get saved events
    const { rows } = await pool.query(
      `SELECT e.id, e.title, e.description, e.start_time, e.end_time, e.category,
              e.created_by, u.name as creator_name,
              ST_X(e.location::geometry) as longitude,
              ST_Y(e.location::geometry) as latitude,
              COALESCE(AVG(er.rating), 0) as average_rating,
              COUNT(er.id) as total_ratings
       FROM saved_events se
       JOIN events e ON se.event_id = e.id
       LEFT JOIN users u ON e.created_by = u.id
       LEFT JOIN event_ratings er ON e.id = er.event_id
       WHERE se.user_id = $1
       GROUP BY e.id, u.name
       ORDER BY se.created_at DESC`,
      [userId]
    );

    res.json({
      status: 'success',
      data: rows,
    });
  } catch (error) {
    logger.error('Get saved events error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting saved events',
    });
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