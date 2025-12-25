import request from 'supertest';
import app from '../../app';
import { prisma } from '../../config/database';
import { hashPassword } from '../../services/authService';

describe('Question Papers - Admin Only Access', () => {
  let adminUser: any;
  let regularUser: any;
  let adminToken: string;
  let regularToken: string;

  beforeAll(async () => {
    // Create admin user
    const adminPassword = await hashPassword('admin123');
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: adminPassword,
        role: 'ADMIN',
      },
    });

    // Create regular user
    const regularPassword = await hashPassword('user123');
    regularUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        password: regularPassword,
        role: 'USER',
      },
    });

    // Login as admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    adminToken = adminLoginRes.body.data.accessToken;

    // Login as regular user
    const regularLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'user123' });
    regularToken = regularLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['admin@test.com', 'user@test.com'] } },
    });
  });

  describe('POST /api/question-papers', () => {
    it('should allow admin to create question paper', async () => {
      const res = await request(app)
        .post('/api/question-papers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Paper',
          totalMarks: 100,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Paper');
    });

    it('should reject regular user from creating question paper', async () => {
      const res = await request(app)
        .post('/api/question-papers')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          title: 'Test Paper',
          totalMarks: 100,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('permissions');
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/question-papers')
        .send({
          title: 'Test Paper',
          totalMarks: 100,
        });

      expect(res.status).toBe(401);
    });
  });
});

