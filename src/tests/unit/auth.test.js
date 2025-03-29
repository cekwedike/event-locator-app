const { expect, chai, createTestUser, loginTestUser } = require('../setup');
const app = require('../../app');

describe('Authentication', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        first_name: 'Test',
        last_name: 'User',
        location: { type: 'Point', coordinates: [0, 0] }
      };

      const response = await chai.request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response).to.have.status(201);
      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('id');
      expect(response.body.user.email).to.equal(userData.email);
      expect(response.body.user.first_name).to.equal(userData.first_name);
      expect(response.body.user.last_name).to.equal(userData.last_name);
    });

    it('should not register user with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Test123!',
        first_name: 'Test',
        last_name: 'User'
      };

      const response = await chai.request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response).to.have.status(400);
      expect(response.body).to.have.property('errors');
      expect(response.body.errors).to.be.an('array');
      expect(response.body.errors[0].msg).to.include('email');
    });

    it('should not register user with weak password', async () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        password: 'weak',
        first_name: 'Test',
        last_name: 'User'
      };

      const response = await chai.request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response).to.have.status(400);
      expect(response.body).to.have.property('errors');
      expect(response.body.errors).to.be.an('array');
      expect(response.body.errors[0].msg).to.include('password');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const testUser = await createTestUser();
      const response = await chai.request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response).to.have.status(200);
      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('id');
      expect(response.body.user.email).to.equal(testUser.email);
    });

    it('should not login with invalid credentials', async () => {
      const response = await chai.request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(response).to.have.status(401);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user profile', async () => {
      const testUser = await createTestUser();
      const token = await loginTestUser(testUser.email, testUser.password);

      const response = await chai.request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response).to.have.status(200);
      expect(response.body).to.have.property('id');
      expect(response.body.email).to.equal(testUser.email);
    });

    it('should not get profile without valid token', async () => {
      const response = await chai.request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response).to.have.status(401);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('Invalid token');
    });
  });
}); 