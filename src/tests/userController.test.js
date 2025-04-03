const request = require('supertest');
const { pool } = require('../config/database');
const app = require('../index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('User Controller', () => {
  let testUser;
  let testToken;

  beforeAll(async () => {
    // Create a test user
    const passwordHash = await bcrypt.hash('password123', 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, name, preferred_language)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, preferred_language`,
      ['test@example.com', passwordHash, 'Test User', 'en']
    );
    testUser = rows[0];

    // Generate token for the test user
    testToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    await pool.end();
  });

  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
          preferred_language: 'en',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data).toHaveProperty('token');

      // Clean up
      await pool.query('DELETE FROM users WHERE email = $1', ['newuser@example.com']);
    });

    it('should not register a user with existing email', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Duplicate User',
          preferred_language: 'en',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('User already exists');
    });
  });

  describe('POST /api/users/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data).toHaveProperty('token');
    });

    it('should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /api/users/preferences', () => {
    it('should update user preferences', async () => {
      const response = await request(app)
        .patch('/api/users/preferences')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          preferred_categories: ['Music', 'Sports'],
          notification_radius: 20,
          notification_enabled: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Preferences updated successfully');
    });
  });

  describe('PATCH /api/users/location', () => {
    it('should update user location', async () => {
      const response = await request(app)
        .patch('/api/users/location')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          latitude: 40.7128,
          longitude: -74.0060,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Location updated successfully');
    });

    it('should not update location with invalid coordinates', async () => {
      const response = await request(app)
        .patch('/api/users/location')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          latitude: 100, // Invalid latitude
          longitude: -200, // Invalid longitude
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });
}); 