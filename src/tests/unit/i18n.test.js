const { expect, chai, createTestUser, loginTestUser } = require('../setup');
const app = require('../../app');

describe('Internationalization (i18n)', () => {
  let testUser;
  let authToken;

  before(async () => {
    testUser = await createTestUser();
    authToken = await loginTestUser(testUser.email, testUser.password);
  });

  describe('Language Detection and Switching', () => {
    it('should detect language from Accept-Language header', async () => {
      const response = await chai.request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept-Language', 'fr');

      expect(response).to.have.status(200);
      expect(response.headers['content-language']).to.equal('fr');
    });

    it('should use default language when no Accept-Language header', async () => {
      const response = await chai.request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.headers['content-language']).to.equal('en');
    });

    it('should switch language using query parameter', async () => {
      const response = await chai.request(app)
        .get('/api/auth/me')
        .query({ lang: 'es' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.headers['content-language']).to.equal('es');
    });
  });

  describe('Translation Content', () => {
    it('should return error messages in selected language', async () => {
      const response = await chai.request(app)
        .post('/api/auth/login')
        .set('Accept-Language', 'fr')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(response).to.have.status(401);
      expect(response.body.message).to.include('Identifiants invalides');
    });

    it('should return validation errors in selected language', async () => {
      const response = await chai.request(app)
        .post('/api/auth/register')
        .set('Accept-Language', 'es')
        .send({
          email: 'invalid-email',
          password: 'weak',
          first_name: '',
          last_name: ''
        });

      expect(response).to.have.status(400);
      expect(response.body.errors).to.be.an('array');
      expect(response.body.errors[0].msg).to.include('correo electrónico');
    });
  });

  describe('Supported Languages', () => {
    it('should handle unsupported language gracefully', async () => {
      const response = await chai.request(app)
        .get('/api/auth/me')
        .set('Accept-Language', 'xx')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response).to.have.status(200);
      expect(response.headers['content-language']).to.equal('en');
    });

    it('should support all configured languages', async () => {
      const languages = ['en', 'es', 'fr', 'de', 'it'];
      
      for (const lang of languages) {
        const response = await chai.request(app)
          .get('/api/auth/me')
          .set('Accept-Language', lang)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response).to.have.status(200);
        expect(response.headers['content-language']).to.equal(lang);
      }
    });
  });

  describe('Dynamic Content Translation', () => {
    it('should translate event categories', async () => {
      // Create a test category
      const categoryData = {
        name: 'Test Category',
        description: 'Test category description'
      };

      const categoryResponse = await chai.request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      // Get category in different languages
      const languages = ['en', 'es', 'fr'];
      for (const lang of languages) {
        const response = await chai.request(app)
          .get(`/api/categories/${categoryResponse.body.id}`)
          .set('Accept-Language', lang)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response).to.have.status(200);
        expect(response.headers['content-language']).to.equal(lang);
      }
    });

    it('should translate error messages for different scenarios', async () => {
      const scenarios = [
        { endpoint: '/api/events/999999', status: 404, lang: 'fr' },
        { endpoint: '/api/categories/999999', status: 404, lang: 'es' },
        { endpoint: '/api/auth/me', status: 401, lang: 'de' }
      ];

      for (const scenario of scenarios) {
        const response = await chai.request(app)
          .get(scenario.endpoint)
          .set('Accept-Language', scenario.lang)
          .set('Authorization', 'invalid-token');

        expect(response).to.have.status(scenario.status);
        expect(response.headers['content-language']).to.equal(scenario.lang);
      }
    });
  });
}); 