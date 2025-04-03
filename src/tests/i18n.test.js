const request = require('supertest');
const app = require('../index');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Internationalization Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Create test user
    const passwordHash = await bcrypt.hash('testpass123', 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, preferred_language) VALUES ($1, $2, $3, $4) RETURNING id',
      ['test@example.com', passwordHash, 'Test User', 'en']
    );
    testUser = result.rows[0];
    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
    await pool.end();
  });

  describe('Language Detection and Switching', () => {
    it('should detect language from Accept-Language header', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Accept-Language', 'es');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('API funcionando correctamente');
    });

    it('should use user preferred language when authenticated', async () => {
      // Update user preferred language to French
      await pool.query(
        'UPDATE users SET preferred_language = $1 WHERE id = $2',
        ['fr', testUser.id]
      );

      const response = await request(app)
        .get('/api/health')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('API fonctionne correctement');
    });

    it('should fall back to default language when translation is missing', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Accept-Language', 'xx'); // Non-existent language

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('API is running');
    });
  });

  describe('Translation Content', () => {
    it('should translate error messages', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .set('Accept-Language', 'es');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Ruta no encontrada');
    });

    it('should translate validation messages', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .set('Accept-Language', 'fr')
        .send({
          email: 'invalid-email',
          password: '123',
          name: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('doit être une adresse e-mail valide');
    });
  });

  describe('Language Preference Updates', () => {
    it('should update user language preference', async () => {
      const response = await request(app)
        .put('/api/users/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preferred_language: 'es'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.preferred_language).toBe('es');

      // Verify in database
      const { rows } = await pool.query(
        'SELECT preferred_language FROM users WHERE id = $1',
        [testUser.id]
      );
      expect(rows[0].preferred_language).toBe('es');
    });

    it('should validate language codes', async () => {
      const response = await request(app)
        .put('/api/users/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preferred_language: 'invalid'
        });

      expect(response.status).toBe(400);
    });
  });
}); 