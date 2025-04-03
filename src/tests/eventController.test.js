const request = require('supertest');
const { pool } = require('../config/database');
const app = require('../index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Event Controller', () => {
  let testUser;
  let testToken;
  let testEvent;

  beforeAll(async () => {
    // Create a test user
    const passwordHash = await bcrypt.hash('password123', 10);
    const { rows: userRows } = await pool.query(
      `INSERT INTO users (email, password_hash, name, preferred_language, location)
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326))
       RETURNING id, email, name, preferred_language`,
      ['test@example.com', passwordHash, 'Test User', 'en', -74.0060, 40.7128]
    );
    testUser = userRows[0];

    // Generate token for the test user
    testToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Create a test event
    const { rows: eventRows } = await pool.query(
      `INSERT INTO events (
        title, description, location, start_time, end_time, category, created_by
      )
      VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8)
      RETURNING id, title, description, start_time, end_time, category`,
      [
        'Test Event',
        'Test Description',
        -74.0060,
        40.7128,
        new Date(Date.now() + 86400000), // Tomorrow
        new Date(Date.now() + 172800000), // Day after tomorrow
        'Music',
        testUser.id,
      ]
    );
    testEvent = eventRows[0];
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM events WHERE created_by = $1', [testUser.id]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    await pool.end();
  });

  describe('POST /api/events', () => {
    it('should create a new event', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'New Event',
          description: 'New Event Description',
          latitude: 40.7128,
          longitude: -74.0060,
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 172800000).toISOString(),
          category: 'Sports',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe('New Event');

      // Clean up
      await pool.query('DELETE FROM events WHERE title = $1', ['New Event']);
    });

    it('should not create event with invalid date range', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Invalid Event',
          description: 'Invalid Event Description',
          latitude: 40.7128,
          longitude: -74.0060,
          start_time: new Date(Date.now() + 172800000).toISOString(),
          end_time: new Date(Date.now() + 86400000).toISOString(),
          category: 'Sports',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/events/:id', () => {
    it('should get event details', async () => {
      const response = await request(app)
        .get(`/api/events/${testEvent.id}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe('Test Event');
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/events/999999');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /api/events/:id', () => {
    it('should update event details', async () => {
      const response = await request(app)
        .patch(`/api/events/${testEvent.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Updated Event',
          description: 'Updated Description',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Event updated successfully');
    });

    it('should not update event created by another user', async () => {
      // Create another user
      const passwordHash = await bcrypt.hash('password123', 10);
      const { rows } = await pool.query(
        `INSERT INTO users (email, password_hash, name, preferred_language)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email`,
        ['other@example.com', passwordHash, 'Other User', 'en']
      );
      const otherUser = rows[0];
      const otherToken = jwt.sign(
        { id: otherUser.id, email: otherUser.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      const response = await request(app)
        .patch(`/api/events/${testEvent.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Unauthorized Update',
        });

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');

      // Clean up
      await pool.query('DELETE FROM users WHERE id = $1', [otherUser.id]);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete event', async () => {
      const response = await request(app)
        .delete(`/api/events/${testEvent.id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Event deleted successfully');
    });
  });

  describe('GET /api/events/search', () => {
    it('should search events by location', async () => {
      const response = await request(app)
        .get('/api/events/search')
        .send({
          latitude: 40.7128,
          longitude: -74.0060,
          radius: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should search events by category', async () => {
      const response = await request(app)
        .get('/api/events/search')
        .send({
          latitude: 40.7128,
          longitude: -74.0060,
          radius: 10,
          category: 'Music',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/events/:id/rate', () => {
    it('should rate an event', async () => {
      const response = await request(app)
        .post(`/api/events/${testEvent.id}/rate`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          rating: 5,
          review: 'Great event!',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Event rated successfully');
    });

    it('should not rate non-existent event', async () => {
      const response = await request(app)
        .post('/api/events/999999/rate')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          rating: 5,
          review: 'Great event!',
        });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });
  });
}); 