/**
 * Audit Service Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 */

import * as auditService from '../services/auditService';
import { prisma } from '../config/database';

describe('Audit Service', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `audit-test-${Date.now()}@example.com`,
        password: 'hashedpassword',
        name: 'Audit Test User',
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Cleanup - delete audit logs for this test user only
    await prisma.auditLog.deleteMany({ where: { userId: testUserId } });
    // Also delete system logs (where userId is null) that this test created
    await prisma.auditLog.deleteMany({
      where: {
        userId: null,
        action: { in: ['SYSTEM_STARTUP', 'SYSTEM_ERROR'] },
      },
    });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  describe('createAuditLog', () => {
    it('should create audit log with all fields', async () => {
      const log = await auditService.createAuditLog({
        userId: testUserId,
        action: 'USER_LOGIN',
        resource: 'users',
        resourceId: testUserId,
        details: { ip: '127.0.0.1', browser: 'Chrome' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(log).toBeDefined();
      expect(log.userId).toBe(testUserId);
      expect(log.action).toBe('USER_LOGIN');
      expect(log.resource).toBe('users');
      expect(log.ipAddress).toBe('127.0.0.1');
    });

    it('should create audit log without optional fields', async () => {
      const log = await auditService.createAuditLog({
        action: 'SYSTEM_STARTUP',
      });

      expect(log).toBeDefined();
      expect(log.userId).toBeNull();
      expect(log.action).toBe('SYSTEM_STARTUP');
      expect(log.resource).toBeNull();
    });

    it('should store details as JSON', async () => {
      const details = {
        oldValue: 'John',
        newValue: 'Jane',
        reason: 'User requested',
      };

      const log = await auditService.createAuditLog({
        userId: testUserId,
        action: 'USER_UPDATED',
        details,
      });

      expect(log.details).toEqual(details);
    });
  });

  describe('getAuditLogs', () => {
    beforeEach(async () => {
      // Create multiple audit logs
      await prisma.auditLog.createMany({
        data: [
          {
            userId: testUserId,
            action: 'USER_LOGIN',
            resource: 'users',
            ipAddress: '127.0.0.1',
          },
          {
            userId: testUserId,
            action: 'USER_LOGOUT',
            resource: 'users',
            ipAddress: '127.0.0.1',
          },
          {
            action: 'SYSTEM_ERROR',
            resource: 'system',
          },
        ],
      });
    });

    it('should get all audit logs', async () => {
      const logs = await auditService.getAuditLogs();

      expect(logs.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by userId', async () => {
      const logs = await auditService.getAuditLogs({
        userId: testUserId,
      });

      expect(logs.length).toBe(2);
      expect(logs.every((log: any) => log.userId === testUserId)).toBe(true);
    });

    it('should filter by action', async () => {
      const logs = await auditService.getAuditLogs({
        action: 'USER_LOGIN',
      });

      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs.every((log: any) => log.action === 'USER_LOGIN')).toBe(true);
    });

    it('should filter by resource', async () => {
      const logs = await auditService.getAuditLogs({
        resource: 'users',
      });

      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs.every((log: any) => log.resource === 'users')).toBe(true);
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const logs = await auditService.getAuditLogs({
        startDate: yesterday,
        endDate: now,
      });

      expect(logs.length).toBeGreaterThanOrEqual(3);
    });

    it('should paginate results', async () => {
      const logs = await auditService.getAuditLogs({
        limit: 2,
        offset: 1,
      });

      expect(logs.length).toBeLessThanOrEqual(2);
    });

    it('should return logs in descending order by default', async () => {
      const logs = await auditService.getAuditLogs({
        userId: testUserId,
      });

      expect(logs.length).toBeGreaterThan(0);
      // Most recent first
      for (let i = 0; i < logs.length - 1; i++) {
        expect(logs[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          logs[i + 1].createdAt.getTime()
        );
      }
    });
  });

  describe('getAuditLogById', () => {
    it('should get audit log by id', async () => {
      const created = await auditService.createAuditLog({
        userId: testUserId,
        action: 'TEST_ACTION',
      });

      const retrieved = await auditService.getAuditLogById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.action).toBe('TEST_ACTION');
    });

    it('should return null for non-existent id', async () => {
      const retrieved = await auditService.getAuditLogById('non-existent-id');

      expect(retrieved).toBeNull();
    });
  });

  describe('getUserAuditLogs', () => {
    beforeEach(async () => {
      // Create audit logs for user
      await prisma.auditLog.createMany({
        data: [
          {
            userId: testUserId,
            action: 'USER_LOGIN',
            resource: 'users',
          },
          {
            userId: testUserId,
            action: 'PROFILE_UPDATED',
            resource: 'users',
            resourceId: testUserId,
          },
        ],
      });
    });

    it('should get all logs for user', async () => {
      const logs = await auditService.getUserAuditLogs(testUserId);

      expect(logs.length).toBe(2);
      expect(logs.every((log: any) => log.userId === testUserId)).toBe(true);
    });

    it('should paginate user logs', async () => {
      const logs = await auditService.getUserAuditLogs(testUserId, {
        limit: 1,
      });

      expect(logs.length).toBe(1);
    });
  });

  describe('getResourceAuditLogs', () => {
    beforeEach(async () => {
      // Create audit logs for a resource
      await prisma.auditLog.createMany({
        data: [
          {
            userId: testUserId,
            action: 'RESOURCE_CREATED',
            resource: 'orders',
            resourceId: 'order-123',
          },
          {
            userId: testUserId,
            action: 'RESOURCE_UPDATED',
            resource: 'orders',
            resourceId: 'order-123',
          },
          {
            userId: testUserId,
            action: 'RESOURCE_DELETED',
            resource: 'orders',
            resourceId: 'order-456',
          },
        ],
      });
    });

    it('should get all logs for resource type', async () => {
      const logs = await auditService.getResourceAuditLogs('orders');

      expect(logs.length).toBe(3);
      expect(logs.every((log: any) => log.resource === 'orders')).toBe(true);
    });

    it('should get logs for specific resource instance', async () => {
      const logs = await auditService.getResourceAuditLogs('orders', 'order-123');

      expect(logs.length).toBe(2);
      expect(logs.every((log: any) => log.resourceId === 'order-123')).toBe(true);
    });
  });

  describe('deleteOldAuditLogs', () => {
    it('should delete logs older than specified days', async () => {
      // Create old audit log (manually set createdAt)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);

      await prisma.auditLog.create({
        data: {
          userId: testUserId,
          action: 'OLD_ACTION',
          createdAt: oldDate,
        },
      });

      // Create recent log
      await auditService.createAuditLog({
        userId: testUserId,
        action: 'RECENT_ACTION',
      });

      const deletedCount = await auditService.deleteOldAuditLogs(90);

      expect(deletedCount).toBeGreaterThanOrEqual(1);

      // Verify old log is gone
      const logs = await prisma.auditLog.findMany({
        where: { userId: testUserId },
      });

      expect(logs.every((log: any) => log.action !== 'OLD_ACTION')).toBe(true);
    });
  });

  describe('getAuditStats', () => {
    beforeEach(async () => {
      await prisma.auditLog.createMany({
        data: [
          { userId: testUserId, action: 'USER_LOGIN', resource: 'users' },
          { userId: testUserId, action: 'USER_LOGIN', resource: 'users' },
          { userId: testUserId, action: 'USER_LOGOUT', resource: 'users' },
          { action: 'SYSTEM_ERROR', resource: 'system' },
        ],
      });
    });

    it('should return statistics about audit logs', async () => {
      const stats = await auditService.getAuditStats();

      expect(stats).toBeDefined();
      expect(stats.totalLogs).toBeGreaterThanOrEqual(4);
      expect(stats.uniqueUsers).toBeGreaterThanOrEqual(1);
      expect(stats.actionCounts).toBeDefined();
      expect(stats.actionCounts['USER_LOGIN']).toBeGreaterThanOrEqual(2);
    });

    it('should filter stats by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const stats = await auditService.getAuditStats({
        startDate: yesterday,
        endDate: now,
      });

      expect(stats.totalLogs).toBeGreaterThanOrEqual(4);
    });
  });
});

