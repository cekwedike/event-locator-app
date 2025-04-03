const request = require('supertest');
const { pool } = require('../config/database');
const app = require('../index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Event Controller Tests', () => {
  let testUser;
  let testEvent;
  let authToken;

  beforeAll(async () => {
    try {
      // Create test user
      const passwordHash = await bcrypt.hash('testpass123', 10);
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email',
        ['test@example.com', passwordHash, 'Test User']
      );
      testUser = result.rows[0];
      authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET);
    } catch (error) {
      console.error('Error setting up test data:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up test data
      await pool.query('DELETE FROM event_ratings WHERE user_id = $1', [testUser.id]);
      await pool.query('DELETE FROM saved_events WHERE user_id = $1', [testUser.id]);
      await pool.query('DELETE FROM events WHERE created_by = $1', [testUser.id]);
      await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    } catch (error) {
      console.error('Error cleaning up test data:', error);
      throw error;
    }
  });

  describe('POST /api/events', () => {
    it('should create a new event', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        latitude: 40.730610,
        longitude: -73.935242,
        start_time: new Date(Date.now() + 86400000).toISOString(),
        end_time: new Date(Date.now() + 172800000).toISOString(),
        category_id: 1
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(eventData.title);
      testEvent = response.body;
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/events/:id', () => {
    it('should get event by ID', async () => {
      const response = await request(app)
        .get(`/api/events/${testEvent.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testEvent.id);
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/events/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/events/search', () => {
    it('should search events by location', async () => {
      const response = await request(app)
        .get('/api/events/search')
        .query({
          latitude: 40.730610,
          longitude: -73.935242,
          radius: 10000
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter events by category', async () => {
      const response = await request(app)
        .get('/api/events/search')
        .query({
          latitude: 40.730610,
          longitude: -73.935242,
          radius: 10000,
          category_id: 1
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach(event => {
        expect(event.category_id).toBe(1);
      });
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update event', async () => {
      const updateData = {
        title: 'Updated Test Event',
        description: 'Updated Description'
      };

      const response = await request(app)
        .put(`/api/events/${testEvent.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
    });

    it('should not allow updating other user\'s event', async () => {
      // Create another user and event
      const otherUser = await pool.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
        ['other@example.com', await bcrypt.hash('testpass123', 10), 'Other User']
      );

      const otherEvent = await pool.query(
        'INSERT INTO events (title, description, location, start_time, end_time, category_id, created_by) VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8) RETURNING id',
        ['Other Event', 'Description', -73.935242, 40.730610, new Date(), new Date(Date.now() + 86400000), 1, otherUser.rows[0].id]
      );

      const response = await request(app)
        .put(`/api/events/${otherEvent.rows[0].id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Try to update' });

      expect(response.status).toBe(403);

      // Clean up
      await pool.query('DELETE FROM events WHERE id = $1', [otherEvent.rows[0].id]);
      await pool.query('DELETE FROM users WHERE id = $1', [otherUser.rows[0].id]);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete event', async () => {
      const response = await request(app)
        .delete(`/api/events/${testEvent.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify event is deleted
      const checkResponse = await request(app)
        .get(`/api/events/${testEvent.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(checkResponse.status).toBe(404);
    });
  });

  describe('POST /api/events/:id/rate', () => {
    it('should rate an event', async () => {
      // Create a new event to rate
      const newEvent = await pool.query(
        'INSERT INTO events (title, description, location, start_time, end_time, category_id, created_by) VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8) RETURNING id',
        ['Event to Rate', 'Description', -73.935242, 40.730610, new Date(), new Date(Date.now() + 86400000), 1, testUser.id]
      );

      const ratingData = {
        rating: 5,
        review: 'Great event!'
      };

      const response = await request(app)
        .post(`/api/events/${newEvent.rows[0].id}/rate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(ratingData);

      expect(response.status).toBe(201);
      expect(response.body.rating).toBe(ratingData.rating);
      expect(response.body.review).toBe(ratingData.review);

      // Clean up
      await pool.query('DELETE FROM reviews WHERE event_id = $1', [newEvent.rows[0].id]);
      await pool.query('DELETE FROM events WHERE id = $1', [newEvent.rows[0].id]);
    });
  });

  describe('POST /api/events/:id/save', () => {
    it('should save an event', async () => {
      // Create a new event to save
      const newEvent = await pool.query(
        'INSERT INTO events (title, description, location, start_time, end_time, category_id, created_by) VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8) RETURNING id',
        ['Event to Save', 'Description', -73.935242, 40.730610, new Date(), new Date(Date.now() + 86400000), 1, testUser.id]
      );

      const response = await request(app)
        .post(`/api/events/${newEvent.rows[0].id}/save`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify event is saved
      const savedResponse = await request(app)
        .get('/api/events/saved/list')
        .set('Authorization', `Bearer ${authToken}`);

      expect(savedResponse.status).toBe(200);
      expect(savedResponse.body.some(event => event.id === newEvent.rows[0].id)).toBe(true);

      // Clean up
      await pool.query('DELETE FROM saved_events WHERE event_id = $1', [newEvent.rows[0].id]);
      await pool.query('DELETE FROM events WHERE id = $1', [newEvent.rows[0].id]);
    });
  });
}); 