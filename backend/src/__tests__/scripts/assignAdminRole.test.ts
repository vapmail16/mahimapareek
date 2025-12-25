import { prisma } from '../../config/database';
import { assignAdminRole } from '../../scripts/assignAdminRole';

describe('assignAdminRole script', () => {
  const testEmail = 'test-admin@example.com';

  beforeEach(async () => {
    // Clean up test user if exists
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
  });

  afterEach(async () => {
    // Clean up test user
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
  });

  it('should assign ADMIN role to existing user', async () => {
    // Create a user with default role
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: 'hashedpassword',
        role: 'USER',
      },
    });

    expect(user.role).toBe('USER');

    // Assign admin role
    const updatedUser = await assignAdminRole(testEmail);

    expect(updatedUser).not.toBeNull();
    expect(updatedUser?.email).toBe(testEmail);
    expect(updatedUser?.role).toBe('ADMIN');
  });

  it('should return null if user does not exist', async () => {
    const result = await assignAdminRole('nonexistent@example.com');
    expect(result).toBeNull();
  });

  it('should update existing ADMIN to ADMIN (idempotent)', async () => {
    // Create a user with ADMIN role
    await prisma.user.create({
      data: {
        email: testEmail,
        password: 'hashedpassword',
        role: 'ADMIN',
      },
    });

    // Assign admin role again
    const updatedUser = await assignAdminRole(testEmail);

    expect(updatedUser).not.toBeNull();
    expect(updatedUser?.role).toBe('ADMIN');
  });
});

