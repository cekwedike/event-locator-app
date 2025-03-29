const { expect, chai, createTestUser, createTestEvent, loginTestUser } = require('../setup');
const app = require('../../app');

describe('Geospatial Functionality', () => {
  let testUser;
  let authToken;
  let testEvent;

  before(async () => {
    testUser = await createTestUser();
    authToken = await loginTestUser(testUser.email, testUser.password);
    testEvent = await createTestEvent(testUser.id);
  });

  describe('Location-Based Event Search', () => {
    it('should find events within specified radius', async () => {
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
      expect(response.body.length).to.be.at.least(1);
      expect(response.body[0]).to.have.property('distance');
    });

    it('should sort events by distance', async () => {
      // Create events at different distances
      const events = [
        { coordinates: [0.01, 0.01] }, // ~1.4km away
        { coordinates: [0.02, 0.02] }, // ~2.8km away
        { coordinates: [0.03, 0.03] }  // ~4.2km away
      ];

      for (const event of events) {
        await createTestEvent(testUser.id, event.coordinates);
      }

      const response = await chai.request(app)
        .get('/api/events')
        .query({
          lat: 0,
          lng: 0,
          radius: 5000, // 5km radius
          sort: 'distance'
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.at.least(3);

      // Verify distances are in ascending order
      const distances = response.body.map(event => event.distance);
      const sortedDistances = [...distances].sort((a, b) => a - b);
      expect(distances).to.deep.equal(sortedDistances);
    });

    it('should handle invalid coordinates', async () => {
      const response = await chai.request(app)
        .get('/api/events')
        .query({
          lat: 'invalid',
          lng: 'invalid',
          radius: 1000
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(400);
      expect(response.body).to.have.property('errors');
    });
  });

  describe('User Location Management', () => {
    it('should update user location', async () => {
      const newLocation = {
        type: 'Point',
        coordinates: [1.0, 1.0]
      };

      const response = await chai.request(app)
        .put('/api/users/location')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newLocation);

      expect(response).to.have.status(200);
      expect(response.body.location).to.deep.equal(newLocation);
    });

    it('should find nearby events based on user location', async () => {
      // Update user location
      await chai.request(app)
        .put('/api/users/location')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'Point',
          coordinates: [1.0, 1.0]
        });

      // Create events near user
      const events = [
        { coordinates: [1.01, 1.01] }, // ~1.4km away
        { coordinates: [1.02, 1.02] }, // ~2.8km away
        { coordinates: [1.03, 1.03] }  // ~4.2km away
      ];

      for (const event of events) {
        await createTestEvent(testUser.id, event.coordinates);
      }

      const response = await chai.request(app)
        .get('/api/events/nearby')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.at.least(3);
    });
  });

  describe('Geospatial Queries', () => {
    it('should calculate distance between points', async () => {
      const response = await chai.request(app)
        .get('/api/events/distance')
        .query({
          lat1: 0,
          lng1: 0,
          lat2: 1,
          lng2: 1
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.have.property('distance');
      expect(response.body.distance).to.be.a('number');
      expect(response.body.distance).to.be.greaterThan(0);
    });

    it('should find events in a bounding box', async () => {
      const response = await chai.request(app)
        .get('/api/events')
        .query({
          minLat: -1,
          maxLat: 1,
          minLng: -1,
          maxLng: 1
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.be.an('array');
      expect(response.body.every(event => {
        const [lng, lat] = event.location.coordinates;
        return lat >= -1 && lat <= 1 && lng >= -1 && lng <= 1;
      })).to.be.true;
    });
  });

  describe('Geospatial Indexing', () => {
    it('should use spatial index for queries', async () => {
      // Create multiple events
      for (let i = 0; i < 10; i++) {
        await createTestEvent(testUser.id, [
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        ]);
      }

      const response = await chai.request(app)
        .get('/api/events')
        .query({
          lat: 0,
          lng: 0,
          radius: 1000
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.at.least(1);
    });
  });
}); 