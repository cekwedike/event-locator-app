const request = require('supertest');
const app = require('../app');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Test data
let testUser;
let testToken;
let testEvent;
let testCategory;
let testReview;

// Setup function to create test data
async function setupTestData() {
  try {
    // Create test user with a unique email using timestamp
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const passwordHash = await bcrypt.hash('testpass123', 10);
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name, location)
       VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326))
       RETURNING id, email`,
      [testEmail, passwordHash, 'Test User', -73.935242, 40.730610]
    );
    testUser = userResult.rows[0];
    
    // Generate JWT token
    testToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Create test category
    const categoryResult = await pool.query(
      `INSERT INTO categories (name, description, icon)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['Test Category', 'A test category', 'test-icon']
    );
    testCategory = categoryResult.rows[0];
    
    // Create test event
    const eventResult = await pool.query(
      `INSERT INTO events (title, description, location, start_time, end_time, category_id, created_by)
       VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8)
       RETURNING id`,
      [
        'Test Event',
        'A test event description',
        -73.935242,
        40.730610,
        new Date(Date.now() + 86400000), // Tomorrow
        new Date(Date.now() + 172800000), // Day after tomorrow
        testCategory.id,
        testUser.id
      ]
    );
    testEvent = eventResult.rows[0];
    
    // Create test review
    const reviewResult = await pool.query(
      `INSERT INTO reviews (user_id, event_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [testUser.id, testEvent.id, 5, 'Great test event!']
    );
    testReview = reviewResult.rows[0];
    
    console.log('Test data created successfully');
  } catch (error) {
    console.error('Error setting up test data:', error);
    throw error;
  }
}

// Cleanup function to remove test data
async function cleanupTestData() {
  try {
    // Delete test data in reverse order of creation
    if (testReview) {
      await pool.query('DELETE FROM reviews WHERE id = $1', [testReview.id]);
    }
    if (testEvent) {
      await pool.query('DELETE FROM events WHERE id = $1', [testEvent.id]);
    }
    if (testCategory) {
      await pool.query('DELETE FROM categories WHERE id = $1', [testCategory.id]);
    }
    if (testUser) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    }
    console.log('Test data cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
}

// Test all endpoints
async function testAllEndpoints() {
  try {
    // Setup test data
    await setupTestData();
    
    console.log('Testing all API endpoints...');
    
    // Health endpoint
    console.log('\nTesting /health endpoint...');
    const healthResponse = await request(app).get('/health');
    console.log(`Status: ${healthResponse.status}`);
    
    // User endpoints
    console.log('\nTesting user endpoints...');
    
    // Register
    console.log('Testing POST /users/register...');
    const registerResponse = await request(app)
      .post('/users/register')
      .send({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User'
      });
    console.log(`Status: ${registerResponse.status}`);
    
    // Login
    console.log('Testing POST /users/login...');
    const loginResponse = await request(app)
      .post('/users/login')
      .send({
        email: testUser.email,
        password: 'testpass123'
      });
    console.log(`Status: ${loginResponse.status}`);
    
    // Get profile
    console.log('Testing GET /users/profile...');
    const profileResponse = await request(app)
      .get('/users/profile')
      .set('Authorization', `Bearer ${testToken}`);
    console.log(`Status: ${profileResponse.status}`);
    
    // Update preferences
    console.log('Testing PATCH /users/preferences...');
    const preferencesResponse = await request(app)
      .patch('/users/preferences')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        preferred_language: 'es',
        notification_preferences: { email: true, push: false }
      });
    console.log(`Status: ${preferencesResponse.status}`);
    
    // Update location
    console.log('Testing PATCH /users/location...');
    const locationResponse = await request(app)
      .patch('/users/location')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        latitude: 40.7128,
        longitude: -74.0060
      });
    console.log(`Status: ${locationResponse.status}`);
    
    // Auth endpoints
    console.log('\nTesting auth endpoints...');
    
    // Refresh token
    console.log('Testing POST /auth/refresh...');
    const refreshResponse = await request(app)
      .post('/auth/refresh')
      .send({
        refreshToken: testToken
      });
    console.log(`Status: ${refreshResponse.status}`);
    
    // Logout
    console.log('Testing POST /auth/logout...');
    const logoutResponse = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${testToken}`);
    console.log(`Status: ${logoutResponse.status}`);
    
    // Change password
    console.log('Testing POST /auth/change-password...');
    const changePasswordResponse = await request(app)
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        currentPassword: 'testpass123',
        newPassword: 'newpassword123'
      });
    console.log(`Status: ${changePasswordResponse.status}`);
    
    // Forgot password
    console.log('Testing POST /auth/forgot-password...');
    const forgotPasswordResponse = await request(app)
      .post('/auth/forgot-password')
      .send({
        email: testUser.email
      });
    console.log(`Status: ${forgotPasswordResponse.status}`);
    
    // Reset password
    console.log('Testing POST /auth/reset-password...');
    const resetPasswordResponse = await request(app)
      .post('/auth/reset-password')
      .send({
        token: 'test-token',
        newPassword: 'resetpassword123'
      });
    console.log(`Status: ${resetPasswordResponse.status}`);
    
    // Event endpoints
    console.log('\nTesting event endpoints...');
    
    // Search events
    console.log('Testing GET /events/search...');
    const searchResponse = await request(app)
      .get('/events/search')
      .query({
        latitude: 40.730610,
        longitude: -73.935242,
        radius: 10
      });
    console.log(`Status: ${searchResponse.status}`);
    
    // Get event by ID
    console.log('Testing GET /events/:id...');
    const getEventResponse = await request(app)
      .get(`/events/${testEvent.id}`);
    console.log(`Status: ${getEventResponse.status}`);
    
    // Create event
    console.log('Testing POST /events...');
    const createEventResponse = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: 'New Test Event',
        description: 'A new test event description',
        latitude: 40.7128,
        longitude: -74.0060,
        start_time: new Date(Date.now() + 86400000),
        end_time: new Date(Date.now() + 172800000),
        category_id: testCategory.id
      });
    console.log(`Status: ${createEventResponse.status}`);
    
    // Update event
    console.log('Testing PUT /events/:id...');
    const updateEventResponse = await request(app)
      .put(`/events/${testEvent.id}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: 'Updated Test Event',
        description: 'An updated test event description',
        latitude: 40.7128,
        longitude: -74.0060,
        start_time: new Date(Date.now() + 86400000),
        end_time: new Date(Date.now() + 172800000),
        category_id: testCategory.id
      });
    console.log(`Status: ${updateEventResponse.status}`);
    
    // Delete event
    console.log('Testing DELETE /events/:id...');
    const deleteEventResponse = await request(app)
      .delete(`/events/${testEvent.id}`)
      .set('Authorization', `Bearer ${testToken}`);
    console.log(`Status: ${deleteEventResponse.status}`);
    
    // Rate event
    console.log('Testing POST /events/:id/rate...');
    const rateEventResponse = await request(app)
      .post(`/events/${testEvent.id}/rate`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        rating: 4,
        review: 'Great event!'
      });
    console.log(`Status: ${rateEventResponse.status}`);
    
    // Save event
    console.log('Testing POST /events/:id/save...');
    const saveEventResponse = await request(app)
      .post(`/events/${testEvent.id}/save`)
      .set('Authorization', `Bearer ${testToken}`);
    console.log(`Status: ${saveEventResponse.status}`);
    
    // Get saved events
    console.log('Testing GET /events/saved/list...');
    const savedEventsResponse = await request(app)
      .get('/events/saved/list')
      .set('Authorization', `Bearer ${testToken}`);
    console.log(`Status: ${savedEventsResponse.status}`);
    
    // Category endpoints
    console.log('\nTesting category endpoints...');
    
    // Get all categories
    console.log('Testing GET /categories...');
    const categoriesResponse = await request(app)
      .get('/categories');
    console.log(`Status: ${categoriesResponse.status}`);
    
    // Get category by ID
    console.log('Testing GET /categories/:id...');
    const getCategoryResponse = await request(app)
      .get(`/categories/${testCategory.id}`);
    console.log(`Status: ${getCategoryResponse.status}`);
    
    // Create category
    console.log('Testing POST /categories...');
    const createCategoryResponse = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'New Test Category',
        description: 'A new test category',
        icon: 'new-test-icon'
      });
    console.log(`Status: ${createCategoryResponse.status}`);
    
    // Update category
    console.log('Testing PATCH /categories/:id...');
    const updateCategoryResponse = await request(app)
      .patch(`/categories/${testCategory.id}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Updated Test Category',
        description: 'An updated test category',
        icon: 'updated-test-icon'
      });
    console.log(`Status: ${updateCategoryResponse.status}`);
    
    // Delete category
    console.log('Testing DELETE /categories/:id...');
    const deleteCategoryResponse = await request(app)
      .delete(`/categories/${testCategory.id}`)
      .set('Authorization', `Bearer ${testToken}`);
    console.log(`Status: ${deleteCategoryResponse.status}`);
    
    // Review endpoints
    console.log('\nTesting review endpoints...');
    
    // Get event reviews
    console.log('Testing GET /events/:eventId/reviews...');
    const eventReviewsResponse = await request(app)
      .get(`/events/${testEvent.id}/reviews`);
    console.log(`Status: ${eventReviewsResponse.status}`);
    
    // Get review by ID
    console.log('Testing GET /reviews/:id...');
    const getReviewResponse = await request(app)
      .get(`/reviews/${testReview.id}`);
    console.log(`Status: ${getReviewResponse.status}`);
    
    // Create review
    console.log('Testing POST /events/:eventId/reviews...');
    const createReviewResponse = await request(app)
      .post(`/events/${testEvent.id}/reviews`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        rating: 5,
        comment: 'Another great review!'
      });
    console.log(`Status: ${createReviewResponse.status}`);
    
    // Update review
    console.log('Testing PATCH /reviews/:id...');
    const updateReviewResponse = await request(app)
      .patch(`/reviews/${testReview.id}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        rating: 4,
        comment: 'Updated review comment'
      });
    console.log(`Status: ${updateReviewResponse.status}`);
    
    // Delete review
    console.log('Testing DELETE /reviews/:id...');
    const deleteReviewResponse = await request(app)
      .delete(`/reviews/${testReview.id}`)
      .set('Authorization', `Bearer ${testToken}`);
    console.log(`Status: ${deleteReviewResponse.status}`);
    
    console.log('\nAll endpoints tested successfully!');
  } catch (error) {
    console.error('Error testing endpoints:', error);
  } finally {
    // Cleanup test data
    await cleanupTestData();
  }
}

// Run the tests
testAllEndpoints(); 