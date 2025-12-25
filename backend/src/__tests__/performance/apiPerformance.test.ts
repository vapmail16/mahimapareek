/**
 * Performance Tests - API Response Times
 * 
 * Tests that API endpoints respond within acceptable time limits
 */

import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { createTestUser } from '../../tests/setup';

describe('API Performance Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Create test user and get token
    await createTestUser({
      email: 'perf@test.com',
      password: 'Password123!',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'perf@test.com',
        password: 'Password123!',
      });

    if (loginRes.status === 200 && loginRes.body.data?.accessToken) {
      authToken = loginRes.body.data.accessToken;
    } else {
      throw new Error('Failed to get auth token for performance tests');
    }
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'perf@test.com' },
    });
  });

  describe('Response Time Benchmarks', () => {
    it('should respond to health check within 100ms', async () => {
      const start = Date.now();
      const res = await request(app).get('/health');
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(100);
    });

    it('should respond to GET /api/auth/me within 200ms', async () => {
      const start = Date.now();
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(200);
    });

    it('should respond to GET /api/categories within 500ms', async () => {
      const start = Date.now();
      const res = await request(app).get('/api/categories');
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(500);
    });

    it('should respond to GET /api/posts within 500ms', async () => {
      const start = Date.now();
      const res = await request(app).get('/api/posts');
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Database Query Performance', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/categories')
          .expect(200)
      );

      const start = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - start;

      // All 10 requests should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
    });
  });
});

