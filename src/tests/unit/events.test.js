const { expect, chai, createTestUser, createTestEvent, loginTestUser } = require('../setup');
const app = require('../../app');

describe('Event Management', () => {
  let testUser;
  let authToken;
  let testEvent;

  before(async () => {
    testUser = await createTestUser();
    authToken = await loginTestUser(testUser.email, testUser.password);
    testEvent = await createTestEvent(testUser.id);
  });

  describe('POST /api/events', () => {
    it('should create a new event', async () => {
      const eventData = {
        title: `Test Event ${Date.now()}`,
        description: 'Test event description',
        start_date: new Date(Date.now() + 86400000),
        end_date: new Date(Date.now() + 172800000),
        location: { type: 'Point', coordinates: [0, 0] },
        max_participants: 100,
        price: 0
      };

      const response = await chai.request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      expect(response).to.have.status(201);
      expect(response.body).to.have.property('id');
      expect(response.body.title).to.equal(eventData.title);
      expect(response.body.description).to.equal(eventData.description);
      expect(response.body.organizer_id).to.equal(testUser.id);
    });

    it('should not create event with invalid dates', async () => {
      const eventData = {
        title: `Test Event ${Date.now()}`,
        description: 'Test event description',
        start_date: new Date(Date.now() + 172800000),
        end_date: new Date(Date.now() + 86400000),
        location: { type: 'Point', coordinates: [0, 0] },
        max_participants: 100,
        price: 0
      };

      const response = await chai.request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      expect(response).to.have.status(400);
      expect(response.body).to.have.property('errors');
      expect(response.body.errors).to.be.an('array');
      expect(response.body.errors[0].msg).to.include('end_date');
    });
  });

  describe('GET /api/events', () => {
    it('should get all events', async () => {
      const response = await chai.request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.at.least(1);
    });

    it('should get events with location-based search', async () => {
      const response = await chai.request(app)
        .get('/api/events')
        .query({
          lat: 0,
          lng: 0,
          radius: 1000 // 1km radius
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.be.an('array');
    });
  });

  describe('GET /api/events/:id', () => {
    it('should get event by id', async () => {
      const response = await chai.request(app)
        .get(`/api/events/${testEvent.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body.id).to.equal(testEvent.id);
    });

    it('should return 404 for non-existent event', async () => {
      const response = await chai.request(app)
        .get('/api/events/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(404);
      expect(response.body).to.have.property('message');
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update event', async () => {
      const updateData = {
        title: 'Updated Event Title',
        description: 'Updated description'
      };

      const response = await chai.request(app)
        .put(`/api/events/${testEvent.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response).to.have.status(200);
      expect(response.body.title).to.equal(updateData.title);
      expect(response.body.description).to.equal(updateData.description);
    });

    it('should not update event with invalid data', async () => {
      const updateData = {
        start_date: new Date(Date.now() + 172800000),
        end_date: new Date(Date.now() + 86400000)
      };

      const response = await chai.request(app)
        .put(`/api/events/${testEvent.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response).to.have.status(400);
      expect(response.body).to.have.property('errors');
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete event', async () => {
      const response = await chai.request(app)
        .delete(`/api/events/${testEvent.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.have.property('message');

      // Verify event is deleted
      const getResponse = await chai.request(app)
        .get(`/api/events/${testEvent.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse).to.have.status(404);
    });
  });
}); 