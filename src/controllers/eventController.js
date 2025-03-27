const { db } = require('../config/database');
const { validationResult } = require('express-validator');
const { NotFoundError, ValidationError } = require('../utils/errors');

// Create a new event
const createEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      location,
      address,
      startDate,
      endDate,
      maxParticipants,
      price,
      categories
    } = req.body;

    // Start a transaction
    const result = await db.tx(async (t) => {
      // Create the event
      const event = await t.one(
        `INSERT INTO events (
          title, description, location, address, start_date, end_date,
          max_participants, price, created_by
        ) VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          title, description, location.longitude, location.latitude,
          address, startDate, endDate, maxParticipants, price, req.user.id
        ]
      );

      // Add categories if provided
      if (categories && categories.length > 0) {
        const categoryValues = categories.map(catId => `(${event.id}, ${catId})`).join(',');
        await t.none(
          `INSERT INTO event_categories (event_id, category_id)
           VALUES ${categoryValues}`
        );
      }

      return event;
    });

    res.status(201).json({
      message: req.t('events.create.success'),
      event: result
    });
  } catch (error) {
    next(error);
  }
};

// Get event by ID
const getEvent = async (req, res, next) => {
  try {
    const event = await db.oneOrNone(
      `SELECT e.*, 
              ST_AsGeoJSON(e.location) as location,
              array_agg(DISTINCT c.id) as category_ids,
              array_agg(DISTINCT c.name) as category_names,
              COUNT(DISTINCT er.id) as rating_count,
              AVG(er.rating) as average_rating
       FROM events e
       LEFT JOIN event_categories ec ON e.id = ec.event_id
       LEFT JOIN categories c ON ec.category_id = c.id
       LEFT JOIN event_ratings er ON e.id = er.event_id
       WHERE e.id = $1
       GROUP BY e.id`,
      [req.params.id]
    );

    if (!event) {
      throw new NotFoundError(req.t('events.update.notFound'));
    }

    res.json({ event });
  } catch (error) {
    next(error);
  }
};

// Update event
const updateEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      location,
      address,
      startDate,
      endDate,
      maxParticipants,
      price,
      categories
    } = req.body;

    // Start a transaction
    const result = await db.tx(async (t) => {
      // Check if event exists and user has permission
      const existingEvent = await t.oneOrNone(
        'SELECT * FROM events WHERE id = $1',
        [req.params.id]
      );

      if (!existingEvent) {
        throw new NotFoundError(req.t('events.update.notFound'));
      }

      if (existingEvent.created_by !== req.user.id && !req.user.is_admin) {
        throw new ForbiddenError('You do not have permission to update this event');
      }

      // Update the event
      const event = await t.one(
        `UPDATE events 
         SET title = $1, description = $2, location = ST_SetSRID(ST_MakePoint($3, $4), 4326),
             address = $5, start_date = $6, end_date = $7,
             max_participants = $8, price = $9, updated_at = CURRENT_TIMESTAMP
         WHERE id = $10
         RETURNING *`,
        [
          title, description, location.longitude, location.latitude,
          address, startDate, endDate, maxParticipants, price, req.params.id
        ]
      );

      // Update categories if provided
      if (categories) {
        // Remove existing categories
        await t.none('DELETE FROM event_categories WHERE event_id = $1', [event.id]);
        
        // Add new categories
        if (categories.length > 0) {
          const categoryValues = categories.map(catId => `(${event.id}, ${catId})`).join(',');
          await t.none(
            `INSERT INTO event_categories (event_id, category_id)
             VALUES ${categoryValues}`
          );
        }
      }

      return event;
    });

    res.json({
      message: req.t('events.update.success'),
      event: result
    });
  } catch (error) {
    next(error);
  }
};

// Delete event
const deleteEvent = async (req, res, next) => {
  try {
    const result = await db.tx(async (t) => {
      const event = await t.oneOrNone(
        'SELECT * FROM events WHERE id = $1',
        [req.params.id]
      );

      if (!event) {
        throw new NotFoundError(req.t('events.delete.notFound'));
      }

      if (event.created_by !== req.user.id && !req.user.is_admin) {
        throw new ForbiddenError('You do not have permission to delete this event');
      }

      await t.none('DELETE FROM events WHERE id = $1', [req.params.id]);
      return event;
    });

    res.json({
      message: req.t('events.delete.success'),
      event: result
    });
  } catch (error) {
    next(error);
  }
};

// Search events
const searchEvents = async (req, res, next) => {
  try {
    const {
      latitude,
      longitude,
      radius, // in kilometers
      categories,
      startDate,
      endDate,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10
    } = req.query;

    const offset = (page - 1) * limit;

    // Build the base query
    let query = `
      SELECT e.*, 
             ST_AsGeoJSON(e.location) as location,
             array_agg(DISTINCT c.id) as category_ids,
             array_agg(DISTINCT c.name) as category_names,
             COUNT(DISTINCT er.id) as rating_count,
             AVG(er.rating) as average_rating,
             ST_Distance(
               e.location::geography,
               ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
             ) as distance
      FROM events e
      LEFT JOIN event_categories ec ON e.id = ec.event_id
      LEFT JOIN categories c ON ec.category_id = c.id
      LEFT JOIN event_ratings er ON e.id = er.event_id
      WHERE 1=1
    `;

    const queryParams = [longitude, latitude];
    let paramCount = 2;

    // Add filters
    if (radius) {
      query += ` AND ST_DWithin(
        e.location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $${++paramCount} * 1000
      )`;
      queryParams.push(radius);
    }

    if (categories) {
      const categoryIds = categories.split(',').map(Number);
      query += ` AND EXISTS (
        SELECT 1 FROM event_categories ec2
        WHERE ec2.event_id = e.id
        AND ec2.category_id = ANY($${++paramCount})
      )`;
      queryParams.push(categoryIds);
    }

    if (startDate) {
      query += ` AND e.start_date >= $${++paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ` AND e.end_date <= $${++paramCount}`;
      queryParams.push(endDate);
    }

    if (minPrice) {
      query += ` AND e.price >= $${++paramCount}`;
      queryParams.push(minPrice);
    }

    if (maxPrice) {
      query += ` AND e.price <= $${++paramCount}`;
      queryParams.push(maxPrice);
    }

    // Group and order
    query += `
      GROUP BY e.id
      ORDER BY distance ASC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    queryParams.push(limit, offset);

    // Get total count
    const countQuery = query.replace(
      'SELECT e.*, ST_AsGeoJSON(e.location) as location, array_agg(DISTINCT c.id) as category_ids, array_agg(DISTINCT c.name) as category_names, COUNT(DISTINCT er.id) as rating_count, AVG(er.rating) as average_rating, ST_Distance(e.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance',
      'SELECT COUNT(DISTINCT e.id) as total'
    ).replace('GROUP BY e.id ORDER BY distance ASC LIMIT $' + (queryParams.length - 2) + ' OFFSET $' + (queryParams.length - 1), '');

    const [events, total] = await Promise.all([
      db.any(query, queryParams),
      db.one(countQuery, queryParams.slice(0, -2))
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

// Add categories to an event
const addEventCategories = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { categoryIds } = req.body;

    // Verify event exists and user has permission
    const event = await db.oneOrNone(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.user_id !== req.user.id && !req.user.is_admin) {
      throw new ForbiddenError('Not authorized to modify this event');
    }

    // Add categories
    await db.tx(async t => {
      // Remove existing categories
      await t.none('DELETE FROM event_categories WHERE event_id = $1', [eventId]);
      
      // Add new categories
      if (categoryIds && categoryIds.length > 0) {
        const values = categoryIds.map(catId => `(${eventId}, ${catId})`).join(',');
        await t.none(
          `INSERT INTO event_categories (event_id, category_id)
           VALUES ${values}
           ON CONFLICT DO NOTHING`
        );
      }
    });

    // Get updated event with categories
    const updatedEvent = await db.one(
      `SELECT e.*, 
              array_agg(DISTINCT c.id) as category_ids,
              array_agg(DISTINCT c.name) as category_names
       FROM events e
       LEFT JOIN event_categories ec ON e.id = ec.event_id
       LEFT JOIN categories c ON ec.category_id = c.id
       WHERE e.id = $1
       GROUP BY e.id`,
      [eventId]
    );

    res.json({
      message: req.t('events.categories.update.success'),
      event: updatedEvent
    });
  } catch (error) {
    next(error);
  }
};

// Get events by category
const getEventsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;
    const events = await db.any(
      `SELECT e.*, 
              u.username as organizer_name,
              u.avatar_url as organizer_avatar,
              COUNT(DISTINCT r.id) as review_count,
              COALESCE(AVG(r.rating), 0) as average_rating
       FROM events e
       JOIN event_categories ec ON e.id = ec.event_id
       JOIN users u ON e.user_id = u.id
       LEFT JOIN reviews r ON e.id = r.event_id
       WHERE ec.category_id = $1
       GROUP BY e.id, u.username, u.avatar_url
       ORDER BY e.start_date ASC
       LIMIT $2 OFFSET $3`,
      [categoryId, limit, offset]
    );

    // Get total count
    const total = await db.one(
      `SELECT COUNT(DISTINCT e.id)
       FROM events e
       JOIN event_categories ec ON e.id = ec.event_id
       WHERE ec.category_id = $1`,
      [categoryId]
    );

    res.json({
      events,
      pagination: {
        total: parseInt(total.count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  searchEvents,
  addEventCategories,
  getEventsByCategory
}; 