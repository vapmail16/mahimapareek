import { prisma } from '../config/database';

// Setup before all tests
beforeAll(async () => {
  // Ensure test database is connected
  await prisma.$connect();
});

// Cleanup after all tests
afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();
});

// Clean database before each test
beforeEach(async () => {
  // Delete all data in reverse order of dependencies
  await prisma.auditLog.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

// Helper to create test user
export const createTestUser = async (overrides?: any) => {
  const bcrypt = require('bcryptjs');
  
  const defaultUser = {
    email: 'test@example.com',
    password: await bcrypt.hash('Password123!', 12),
    name: 'Test User',
    role: 'USER' as any,
  };

  return prisma.user.create({
    data: { ...defaultUser, ...overrides },
  });
};

// Helper to create test admin
export const createTestAdmin = async (overrides?: any) => {
  return createTestUser({
    email: 'admin@example.com',
    role: 'ADMIN' as any,
    ...overrides,
  });
};

