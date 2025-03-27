const { expect } = require('chai');
const request = require('supertest');
const app = require('../../app');
const {
  createTestUser,
  createTestCategory,
  generateTestToken,
  cleanupTestData
} = require('../helpers/testSetup');

describe('Category Routes', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let regularToken;
  let testCategory;

  before(async () => {
    // Create test users
    adminUser = await createTestUser({ is_admin: true });
    regularUser = await createTestUser({ is_admin: false });
    
    // Generate tokens
    adminToken = generateTestToken(adminUser);
    regularToken = generateTestToken(regularUser);
    
    // Create test category
    testCategory = await createTestCategory();
  });

  after(async () => {
    await cleanupTestData();
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body).to.have.property('categories');
      expect(response.body.categories).to.be.an('array');
      expect(response.body.categories.length).to.be.greaterThan(0);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return a category by ID', async () => {
      const response = await request(app)
        .get(`/api/categories/${testCategory.id}`)
        .expect(200);

      expect(response.body).to.have.property('category');
      expect(response.body.category.id).to.equal(testCategory.id);
    });

    it('should return 404 for non-existent category', async () => {
      await request(app)
        .get('/api/categories/999999')
        .expect(404);
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category (admin only)', async () => {
      const newCategory = {
        name: 'New Test Category',
        description: 'New test category description'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newCategory)
        .expect(201);

      expect(response.body).to.have.property('category');
      expect(response.body.category.name).to.equal(newCategory.name);
    });

    it('should not allow regular users to create categories', async () => {
      const newCategory = {
        name: 'Unauthorized Category',
        description: 'This should fail'
      };

      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(newCategory)
        .expect(403);
    });

    it('should validate required fields', async () => {
      const invalidCategory = {
        description: 'Missing name'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidCategory)
        .expect(400);

      expect(response.body).to.have.property('errors');
      expect(response.body.errors[0].msg).to.include('Category name is required');
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update a category (admin only)', async () => {
      const updateData = {
        name: 'Updated Category Name',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('category');
      expect(response.body.category.name).to.equal(updateData.name);
    });

    it('should not allow regular users to update categories', async () => {
      const updateData = {
        name: 'Unauthorized Update',
        description: 'This should fail'
      };

      await request(app)
        .put(`/api/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should return 404 for non-existent category', async () => {
      const updateData = {
        name: 'Non-existent Update',
        description: 'This should fail'
      };

      await request(app)
        .put('/api/categories/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete a category (admin only)', async () => {
      const categoryToDelete = await createTestCategory();

      await request(app)
        .delete(`/api/categories/${categoryToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify category is deleted
      await request(app)
        .get(`/api/categories/${categoryToDelete.id}`)
        .expect(404);
    });

    it('should not allow regular users to delete categories', async () => {
      const categoryToDelete = await createTestCategory();

      await request(app)
        .delete(`/api/categories/${categoryToDelete.id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      // Verify category still exists
      await request(app)
        .get(`/api/categories/${categoryToDelete.id}`)
        .expect(200);
    });

    it('should return 404 for non-existent category', async () => {
      await request(app)
        .delete('/api/categories/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
}); 