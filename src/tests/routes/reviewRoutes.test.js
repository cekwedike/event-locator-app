const { expect } = require('chai');
const request = require('supertest');
const app = require('../../app');
const {
  createTestUser,
  createTestEvent,
  createTestCategory,
  generateTestToken,
  cleanupTestData
} = require('../helpers/testSetup');

describe('Review Routes', () => {
  let eventOwner;
  let reviewer;
  let otherUser;
  let eventOwnerToken;
  let reviewerToken;
  let otherUserToken;
  let testEvent;
  let testCategory;

  before(async () => {
    // Create test users
    eventOwner = await createTestUser();
    reviewer = await createTestUser();
    otherUser = await createTestUser();
    
    // Generate tokens
    eventOwnerToken = generateTestToken(eventOwner);
    reviewerToken = generateTestToken(reviewer);
    otherUserToken = generateTestToken(otherUser);
    
    // Create test category and event
    testCategory = await createTestCategory();
    testEvent = await createTestEvent(eventOwner, {
      title: 'Test Event for Reviews'
    });
  });

  after(async () => {
    await cleanupTestData();
  });

  describe('GET /api/reviews/event/:eventId', () => {
    it('should return reviews for an event', async () => {
      const response = await request(app)
        .get(`/api/reviews/event/${testEvent.id}`)
        .expect(200);

      expect(response.body).to.have.property('reviews');
      expect(response.body).to.have.property('averageRating');
      expect(response.body.reviews).to.be.an('array');
    });

    it('should return empty reviews for event with no reviews', async () => {
      const response = await request(app)
        .get(`/api/reviews/event/${testEvent.id}`)
        .expect(200);

      expect(response.body.reviews).to.be.an('array').that.is.empty;
      expect(response.body.averageRating).to.equal(0);
    });
  });

  describe('POST /api/reviews/event/:eventId', () => {
    it('should create a new review', async () => {
      const reviewData = {
        rating: 5,
        comment: 'Great event!'
      };

      const response = await request(app)
        .post(`/api/reviews/event/${testEvent.id}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body).to.have.property('review');
      expect(response.body.review.rating).to.equal(reviewData.rating);
      expect(response.body.review.comment).to.equal(reviewData.comment);
      expect(response.body.review).to.have.property('user');
    });

    it('should not allow creating multiple reviews for the same event', async () => {
      const reviewData = {
        rating: 4,
        comment: 'Another review'
      };

      await request(app)
        .post(`/api/reviews/event/${testEvent.id}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send(reviewData)
        .expect(403);
    });

    it('should validate review data', async () => {
      const invalidReview = {
        rating: 6, // Invalid rating
        comment: 'Too short' // Too short comment
      };

      const response = await request(app)
        .post(`/api/reviews/event/${testEvent.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(invalidReview)
        .expect(400);

      expect(response.body).to.have.property('errors');
    });
  });

  describe('PUT /api/reviews/:id', () => {
    let reviewId;

    before(async () => {
      // Create a review to update
      const reviewData = {
        rating: 3,
        comment: 'Initial review'
      };

      const response = await request(app)
        .post(`/api/reviews/event/${testEvent.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(reviewData);

      reviewId = response.body.review.id;
    });

    it('should update own review', async () => {
      const updateData = {
        rating: 4,
        comment: 'Updated review'
      };

      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.review.rating).to.equal(updateData.rating);
      expect(response.body.review.comment).to.equal(updateData.comment);
    });

    it('should not allow updating other user\'s review', async () => {
      const updateData = {
        rating: 1,
        comment: 'Unauthorized update'
      };

      await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should return 404 for non-existent review', async () => {
      const updateData = {
        rating: 5,
        comment: 'Non-existent review'
      };

      await request(app)
        .put('/api/reviews/999999')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    let reviewId;

    before(async () => {
      // Create a review to delete
      const reviewData = {
        rating: 5,
        comment: 'Review to delete'
      };

      const response = await request(app)
        .post(`/api/reviews/event/${testEvent.id}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send(reviewData);

      reviewId = response.body.review.id;
    });

    it('should delete own review', async () => {
      await request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .expect(200);

      // Verify review is deleted
      const response = await request(app)
        .get(`/api/reviews/event/${testEvent.id}`)
        .expect(200);

      expect(response.body.reviews).to.not.some(review => review.id === reviewId);
    });

    it('should not allow deleting other user\'s review', async () => {
      // Create another review
      const reviewData = {
        rating: 4,
        comment: 'Another review'
      };

      const response = await request(app)
        .post(`/api/reviews/event/${testEvent.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(reviewData);

      const otherReviewId = response.body.review.id;

      await request(app)
        .delete(`/api/reviews/${otherReviewId}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .expect(403);

      // Verify review still exists
      const getResponse = await request(app)
        .get(`/api/reviews/event/${testEvent.id}`)
        .expect(200);

      expect(getResponse.body.reviews).to.some(review => review.id === otherReviewId);
    });

    it('should return 404 for non-existent review', async () => {
      await request(app)
        .delete('/api/reviews/999999')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .expect(404);
    });
  });
}); 