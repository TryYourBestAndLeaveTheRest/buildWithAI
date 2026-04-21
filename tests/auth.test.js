/**
 * Auth Middleware Tests
 *
 * Tests that route guards behave correctly for authenticated and
 * unauthenticated users across key protected and public routes.
 */

const request = require('supertest');
const app = require('../src/app');

describe('Auth Middleware', () => {

  describe('GET / (public feed)', () => {
    it('should return 200 for unauthenticated users', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /dashboard (protected)', () => {
    it('should redirect unauthenticated users to /login', async () => {
      const res = await request(app).get('/dashboard');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  describe('GET /profile (protected)', () => {
    it('should redirect unauthenticated users to /login', async () => {
      const res = await request(app).get('/profile');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  describe('GET /notifications (protected)', () => {
    it('should redirect unauthenticated users to /login', async () => {
      const res = await request(app).get('/notifications');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  describe('GET /transactions/:id (protected)', () => {
    it('should redirect unauthenticated users to /login', async () => {
      const res = await request(app).get('/transactions/000000000000000000000000');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  describe('POST /items/new (protected)', () => {
    it('should redirect unauthenticated users to /login', async () => {
      const res = await request(app)
        .post('/items/new')
        .send('title=Test&description=A test description&price=Free&dorm=North Hall&type=have');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  describe('GET /login (redirects if authenticated)', () => {
    it('should return 200 for unauthenticated users', async () => {
      const res = await request(app).get('/login');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /register (redirects if authenticated)', () => {
    it('should return 200 for unauthenticated users', async () => {
      const res = await request(app).get('/register');
      expect(res.status).toBe(200);
    });
  });
});
