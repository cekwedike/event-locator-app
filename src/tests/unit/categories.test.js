const { expect, chai, createTestUser, loginTestUser } = require('../setup');
const app = require('../../app');

describe('Category Management', () => {
  let testUser;
  let authToken;

  before(async () => {
    testUser = await createTestUser();
    authToken = await loginTestUser(testUser.email, testUser.password);
  });

  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const categoryData = {
        name: `Test Category ${Date.now()}`,
        description: 'Test category description'
      };

      const response = await chai.request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      expect(response).to.have.status(201);
      expect(response.body).to.have.property('id');
      expect(response.body.name).to.equal(categoryData.name);
      expect(response.body.description).to.equal(categoryData.description);
    });

    it('should not create category with duplicate name', async () => {
      const categoryData = {
        name: 'Test Category',
        description: 'Test category description'
      };

      // Create first category
      await chai.request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      // Try to create duplicate
      const response = await chai.request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      expect(response).to.have.status(400);
      expect(response.body).to.have.property('errors');
      expect(response.body.errors).to.be.an('array');
      expect(response.body.errors[0].msg).to.include('name');
    });
  });

  describe('GET /api/categories', () => {
    it('should get all categories', async () => {
      const response = await chai.request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.at.least(1);
    });

    it('should get categories with search query', async () => {
      const response = await chai.request(app)
        .get('/api/categories')
        .query({ search: 'Test' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.be.an('array');
      expect(response.body.every(cat => cat.name.includes('Test'))).to.be.true;
    });
  });

  describe('GET /api/categories/:id', () => {
    let categoryId;

    before(async () => {
      // Create a test category
      const categoryData = {
        name: `Test Category ${Date.now()}`,
        description: 'Test category description'
      };

      const response = await chai.request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      categoryId = response.body.id;
    });

    it('should get category by id', async () => {
      const response = await chai.request(app)
        .get(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body.id).to.equal(categoryId);
    });

    it('should return 404 for non-existent category', async () => {
      const response = await chai.request(app)
        .get('/api/categories/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(404);
      expect(response.body).to.have.property('message');
    });
  });

  describe('PUT /api/categories/:id', () => {
    let categoryId;

    before(async () => {
      // Create a test category
      const categoryData = {
        name: `Test Category ${Date.now()}`,
        description: 'Test category description'
      };

      const response = await chai.request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      categoryId = response.body.id;
    });

    it('should update category', async () => {
      const updateData = {
        name: 'Updated Category Name',
        description: 'Updated description'
      };

      const response = await chai.request(app)
        .put(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response).to.have.status(200);
      expect(response.body.name).to.equal(updateData.name);
      expect(response.body.description).to.equal(updateData.description);
    });

    it('should not update category with duplicate name', async () => {
      // Create another category
      const anotherCategory = await chai.request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Another Category ${Date.now()}`,
          description: 'Another category description'
        });

      const updateData = {
        name: anotherCategory.body.name
      };

      const response = await chai.request(app)
        .put(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response).to.have.status(400);
      expect(response.body).to.have.property('errors');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    let categoryId;

    before(async () => {
      // Create a test category
      const categoryData = {
        name: `Test Category ${Date.now()}`,
        description: 'Test category description'
      };

      const response = await chai.request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      categoryId = response.body.id;
    });

    it('should delete category', async () => {
      const response = await chai.request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.body).to.have.property('message');

      // Verify category is deleted
      const getResponse = await chai.request(app)
        .get(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse).to.have.status(404);
    });
  });
}); 