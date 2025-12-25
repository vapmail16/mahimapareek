/**
 * RBAC Service Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 */

import * as rbacService from '../services/rbacService';
import { prisma } from '../config/database';

describe('RBAC Service', () => {
  let testUserId: string;
  let adminUserId: string;

  beforeEach(async () => {
    // Create test users
    const user = await prisma.user.create({
      data: {
        email: `user-${Date.now()}@example.com`,
        password: 'hashedpassword',
        name: 'Test User',
        role: 'USER',
      },
    });
    testUserId = user.id;

    const admin = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@example.com`,
        password: 'hashedpassword',
        name: 'Admin User',
        role: 'ADMIN',
      },
    });
    adminUserId = admin.id;
  });

  afterEach(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { id: { in: [testUserId, adminUserId] } },
    });
  });

  describe('hasRole', () => {
    it('should return true if user has the role', async () => {
      const result = await rbacService.hasRole(testUserId, 'USER');
      expect(result).toBe(true);
    });

    it('should return false if user does not have the role', async () => {
      const result = await rbacService.hasRole(testUserId, 'ADMIN');
      expect(result).toBe(false);
    });

    it('should return true if user has SUPER_ADMIN role', async () => {
      const superAdmin = await prisma.user.create({
        data: {
          email: `superadmin-${Date.now()}@example.com`,
          password: 'hashedpassword',
          role: 'SUPER_ADMIN',
        },
      });

      const result = await rbacService.hasRole(superAdmin.id, 'SUPER_ADMIN');
      expect(result).toBe(true);

      await prisma.user.delete({ where: { id: superAdmin.id } });
    });

    it('should return false for non-existent user', async () => {
      const result = await rbacService.hasRole('non-existent-id', 'USER');
      expect(result).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true if user has any of the roles', async () => {
      const result = await rbacService.hasAnyRole(testUserId, ['USER', 'ADMIN']);
      expect(result).toBe(true);
    });

    it('should return false if user has none of the roles', async () => {
      const result = await rbacService.hasAnyRole(testUserId, ['ADMIN', 'SUPER_ADMIN']);
      expect(result).toBe(false);
    });

    it('should return true for admin with multiple role check', async () => {
      const result = await rbacService.hasAnyRole(adminUserId, ['ADMIN', 'SUPER_ADMIN']);
      expect(result).toBe(true);
    });
  });

  describe('hasAllRoles', () => {
    it('should return true if user has all roles', async () => {
      const result = await rbacService.hasAllRoles(testUserId, ['USER']);
      expect(result).toBe(true);
    });

    it('should return false if user is missing any role', async () => {
      const result = await rbacService.hasAllRoles(testUserId, ['USER', 'ADMIN']);
      expect(result).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for ADMIN role', async () => {
      const result = await rbacService.isAdmin(adminUserId);
      expect(result).toBe(true);
    });

    it('should return true for SUPER_ADMIN role', async () => {
      const superAdmin = await prisma.user.create({
        data: {
          email: `superadmin2-${Date.now()}@example.com`,
          password: 'hashedpassword',
          role: 'SUPER_ADMIN',
        },
      });

      const result = await rbacService.isAdmin(superAdmin.id);
      expect(result).toBe(true);

      await prisma.user.delete({ where: { id: superAdmin.id } });
    });

    it('should return false for USER role', async () => {
      const result = await rbacService.isAdmin(testUserId);
      expect(result).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('should return true for SUPER_ADMIN role', async () => {
      const superAdmin = await prisma.user.create({
        data: {
          email: `superadmin3-${Date.now()}@example.com`,
          password: 'hashedpassword',
          role: 'SUPER_ADMIN',
        },
      });

      const result = await rbacService.isSuperAdmin(superAdmin.id);
      expect(result).toBe(true);

      await prisma.user.delete({ where: { id: superAdmin.id } });
    });

    it('should return false for ADMIN role', async () => {
      const result = await rbacService.isSuperAdmin(adminUserId);
      expect(result).toBe(false);
    });

    it('should return false for USER role', async () => {
      const result = await rbacService.isSuperAdmin(testUserId);
      expect(result).toBe(false);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const updated = await rbacService.updateUserRole(testUserId, 'ADMIN');

      expect(updated.role).toBe('ADMIN');
    });

    it('should throw error for invalid role', async () => {
      await expect(
        rbacService.updateUserRole(testUserId, 'INVALID_ROLE' as any)
      ).rejects.toThrow();
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        rbacService.updateUserRole('non-existent-id', 'ADMIN')
      ).rejects.toThrow();
    });
  });

  describe('getUserRole', () => {
    it('should get user role', async () => {
      const role = await rbacService.getUserRole(testUserId);
      expect(role).toBe('USER');
    });

    it('should return null for non-existent user', async () => {
      const role = await rbacService.getUserRole('non-existent-id');
      expect(role).toBeNull();
    });
  });

  describe('getUsersByRole', () => {
    it('should get all users with specific role', async () => {
      const users = await rbacService.getUsersByRole('USER');

      expect(users.length).toBeGreaterThanOrEqual(1);
      expect(users.some((u: any) => u.id === testUserId)).toBe(true);
    });

    it('should get all admins', async () => {
      const admins = await rbacService.getUsersByRole('ADMIN');

      expect(admins.length).toBeGreaterThanOrEqual(1);
      expect(admins.some((u: any) => u.id === adminUserId)).toBe(true);
    });

    it('should return empty array for role with no users', async () => {
      // Clean up any existing super admins first
      await prisma.user.deleteMany({ where: { role: 'SUPER_ADMIN' } });

      const users = await rbacService.getUsersByRole('SUPER_ADMIN');
      expect(users).toEqual([]);
    });
  });

  describe('canAccessResource', () => {
    it('should allow user to access own resource', async () => {
      const canAccess = await rbacService.canAccessResource(
        testUserId,
        'user',
        testUserId
      );
      expect(canAccess).toBe(true);
    });

    it('should deny user access to other user resource', async () => {
      const canAccess = await rbacService.canAccessResource(
        testUserId,
        'user',
        adminUserId
      );
      expect(canAccess).toBe(false);
    });

    it('should allow admin to access any resource', async () => {
      const canAccess = await rbacService.canAccessResource(
        adminUserId,
        'user',
        testUserId
      );
      expect(canAccess).toBe(true);
    });

    it('should allow super admin to access any resource', async () => {
      const superAdmin = await prisma.user.create({
        data: {
          email: `superadmin4-${Date.now()}@example.com`,
          password: 'hashedpassword',
          role: 'SUPER_ADMIN',
        },
      });

      const canAccess = await rbacService.canAccessResource(
        superAdmin.id,
        'user',
        testUserId
      );
      expect(canAccess).toBe(true);

      await prisma.user.delete({ where: { id: superAdmin.id } });
    });
  });

  describe('getRoleHierarchy', () => {
    it('should return correct hierarchy level for USER', () => {
      const level = rbacService.getRoleHierarchy('USER');
      expect(level).toBe(1);
    });

    it('should return correct hierarchy level for ADMIN', () => {
      const level = rbacService.getRoleHierarchy('ADMIN');
      expect(level).toBe(3);
    });

    it('should return correct hierarchy level for SUPER_ADMIN', () => {
      const level = rbacService.getRoleHierarchy('SUPER_ADMIN');
      expect(level).toBe(4);
    });

    it('should return 0 for unknown role', () => {
      const level = rbacService.getRoleHierarchy('UNKNOWN' as any);
      expect(level).toBe(0);
    });
  });

  describe('hasHigherRole', () => {
    it('should return true if user has higher role', async () => {
      const result = await rbacService.hasHigherRole(adminUserId, testUserId);
      expect(result).toBe(true);
    });

    it('should return false if user has lower role', async () => {
      const result = await rbacService.hasHigherRole(testUserId, adminUserId);
      expect(result).toBe(false);
    });

    it('should return false if users have same role', async () => {
      const user2 = await prisma.user.create({
        data: {
          email: `user2-${Date.now()}@example.com`,
          password: 'hashedpassword',
          role: 'USER',
        },
      });

      const result = await rbacService.hasHigherRole(testUserId, user2.id);
      expect(result).toBe(false);

      await prisma.user.delete({ where: { id: user2.id } });
    });
  });
});

