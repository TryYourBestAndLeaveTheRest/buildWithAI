/**
 * Input Validation Tests
 *
 * Tests that the validator middleware rejects bad input correctly
 * and returns appropriate HTTP status codes for each form.
 */

const request = require('supertest');
const app = require('../src/app');

describe('Validator Middleware', () => {

  describe('POST /register', () => {
    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({ name: 'Test User', email: 'notanemail', password: 'password123', phone: '+2348012345678', dorm: 'North Hall' });
      expect(res.status).toBe(400);
    });

    it('should return 400 for password less than 6 chars', async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({ name: 'Test User', email: 'test@campus.edu', password: '123', phone: '+2348012345678', dorm: 'North Hall' });
      expect(res.status).toBe(400);
    });

    it('should return 400 for name less than 2 chars', async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({ name: 'X', email: 'test@campus.edu', password: 'password123', phone: '+2348012345678', dorm: 'North Hall' });
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid phone format', async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({ name: 'Test User', email: 'test@campus.edu', password: 'password123', phone: 'abc', dorm: 'North Hall' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /login', () => {
    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/login')
        .type('form')
        .send({ email: 'bademail', password: 'somepassword' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /items/new (unauthenticated — expect redirect)', () => {
    it('should redirect to /login before reaching validation', async () => {
      const res = await request(app)
        .post('/items/new')
        .type('form')
        .send({ title: 'Hi', description: 'Short', price: 'Free', dorm: 'X', type: 'have' });
      // Unauthenticated: auth guard fires before validator
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });
});
