/**
 * GDPR Service Tests (TDD)
 * 
 * Comprehensive tests for GDPR compliance features
 */

import * as gdprService from '../services/gdprService';
import { prisma } from '../config/database';
import { DataExportStatus, DataDeletionStatus, DeletionType, ConsentType } from '@prisma/client';

describe('GDPR Service', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `gdpr-user-${Date.now()}@example.com`,
        password: 'hashedpassword',
        name: 'GDPR Test User',
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Cleanup
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  describe('requestDataExport', () => {
    it('should create data export request', async () => {
      const result = await gdprService.requestDataExport(testUserId);

      expect(result).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.status).toBe(DataExportStatus.PENDING);
      expect(result.requestedAt).toBeDefined();
    });

    it('should allow multiple export requests', async () => {
      const result1 = await gdprService.requestDataExport(testUserId);
      await new Promise(resolve => setTimeout(resolve, 10));
      const result2 = await gdprService.requestDataExport(testUserId);

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('generateDataExport', () => {
    it('should generate complete data export', async () => {
      // Create some data for the user
      await prisma.notification.create({
        data: {
          userId: testUserId,
          title: 'Test Notification',
          message: 'Test Message',
        },
      });

      await prisma.payment.create({
        data: {
          userId: testUserId,
          provider: 'STRIPE',
          providerPaymentId: `pi_test_${Date.now()}`,
          amount: 100,
          currency: 'USD',
        },
      });

      // Request export
      const request = await gdprService.requestDataExport(testUserId);

      // Generate export
      const result = await gdprService.generateDataExport(request.id);

      expect(result).toBeDefined();
      expect(result.data.user.id).toBe(testUserId);
      expect(result.data.notifications).toHaveLength(1);
      expect(result.data.payments).toHaveLength(1);
      expect(result.data.exportMetadata).toBeDefined();
    });

    it('should update export request status to completed', async () => {
      const request = await gdprService.requestDataExport(testUserId);

      await gdprService.generateDataExport(request.id);

      const updatedRequest = await prisma.dataExportRequest.findUnique({
        where: { id: request.id },
      });

      expect(updatedRequest?.status).toBe(DataExportStatus.COMPLETED);
      expect(updatedRequest?.completedAt).toBeDefined();
      expect(updatedRequest?.downloadUrl).toBeDefined();
    });

    it('should throw error for non-existent request', async () => {
      await expect(
        gdprService.generateDataExport('non-existent-id')
      ).rejects.toThrow('Export request not found');
    });
  });

  describe('requestDataDeletion', () => {
    it('should create soft deletion request', async () => {
      const result = await gdprService.requestDataDeletion(
        testUserId,
        DeletionType.SOFT,
        'User requested account closure'
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.status).toBe(DataDeletionStatus.PENDING);
      expect(result.deletionType).toBe(DeletionType.SOFT);
      expect(result.confirmationToken).toBeDefined();
      expect(result.confirmationUrl).toContain('/confirm/');
    });

    it('should create hard deletion request', async () => {
      const result = await gdprService.requestDataDeletion(
        testUserId,
        DeletionType.HARD,
        'GDPR right to be forgotten'
      );

      expect(result.deletionType).toBe(DeletionType.HARD);
      expect(result.reason).toBe('GDPR right to be forgotten');
    });
  });

  describe('confirmDataDeletion', () => {
    it('should confirm deletion request', async () => {
      const request = await gdprService.requestDataDeletion(testUserId);

      await gdprService.confirmDataDeletion(request.confirmationToken!);
      
      // Check database (result is the old request before update)
      const updatedRequest = await prisma.dataDeletionRequest.findUnique({
        where: { id: request.id },
      });

      expect(updatedRequest?.status).toBe(DataDeletionStatus.CONFIRMED);
      expect(updatedRequest?.confirmedAt).toBeDefined();
      expect(updatedRequest?.scheduledFor).toBeDefined();
    });

    it('should throw error for invalid token', async () => {
      await expect(
        gdprService.confirmDataDeletion('invalid-token')
      ).rejects.toThrow('Deletion request not found');
    });

    it('should not allow re-confirmation', async () => {
      const request = await gdprService.requestDataDeletion(testUserId);

      await gdprService.confirmDataDeletion(request.confirmationToken!);

      await expect(
        gdprService.confirmDataDeletion(request.confirmationToken!)
      ).rejects.toThrow('already processed');
    });
  });

  describe('executeDataDeletion', () => {
    it('should execute soft deletion', async () => {
      const request = await gdprService.requestDataDeletion(testUserId, DeletionType.SOFT);
      await gdprService.confirmDataDeletion(request.confirmationToken!);

      await gdprService.executeDataDeletion(request.id);

      // Check user is deactivated
      const user = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(user?.isActive).toBe(false);
      expect(user?.email).toContain('deleted_');
      expect(user?.name).toBe('[Deleted User]');
    });

    it('should execute hard deletion', async () => {
      // Create a separate user for hard deletion test
      const hardDeleteUser = await prisma.user.create({
        data: {
          email: `hard-delete-${Date.now()}@example.com`,
          password: 'password',
          name: 'Hard Delete User',
        },
      });

      const request = await gdprService.requestDataDeletion(hardDeleteUser.id, DeletionType.HARD);
      await gdprService.confirmDataDeletion(request.confirmationToken!);

      await gdprService.executeDataDeletion(request.id);

      // Check user is completely deleted
      const user = await prisma.user.findUnique({ where: { id: hardDeleteUser.id } });
      expect(user).toBeNull();
    });

    it('should not allow execution without confirmation', async () => {
      const request = await gdprService.requestDataDeletion(testUserId);

      await expect(
        gdprService.executeDataDeletion(request.id)
      ).rejects.toThrow('not confirmed');
    });
  });

  describe('grantConsent', () => {
    it('should grant new consent', async () => {
      const result = await gdprService.grantConsent(
        testUserId,
        ConsentType.MARKETING_EMAILS,
        '127.0.0.1',
        'Test User Agent'
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.consentType).toBe(ConsentType.MARKETING_EMAILS);
      expect(result.granted).toBe(true);
      expect(result.grantedAt).toBeDefined();
    });

    it('should update existing consent', async () => {
      // Grant first time
      await gdprService.grantConsent(testUserId, ConsentType.ANALYTICS);

      // Grant again (should update)
      const result = await gdprService.grantConsent(testUserId, ConsentType.ANALYTICS);

      expect(result.granted).toBe(true);

      // Check only one record exists
      const consents = await prisma.consentRecord.findMany({
        where: {
          userId: testUserId,
          consentType: ConsentType.ANALYTICS,
        },
      });

      expect(consents).toHaveLength(1);
    });
  });

  describe('revokeConsent', () => {
    it('should revoke granted consent', async () => {
      // Grant first
      await gdprService.grantConsent(testUserId, ConsentType.COOKIES);

      // Then revoke
      const result = await gdprService.revokeConsent(testUserId, ConsentType.COOKIES);

      expect(result.granted).toBe(false);
      expect(result.revokedAt).toBeDefined();
    });

    it('should throw error for non-existent consent', async () => {
      await expect(
        gdprService.revokeConsent(testUserId, ConsentType.THIRD_PARTY_SHARING)
      ).rejects.toThrow();
    });
  });

  describe('getUserConsents', () => {
    it('should get all user consents', async () => {
      await gdprService.grantConsent(testUserId, ConsentType.MARKETING_EMAILS);
      await new Promise(resolve => setTimeout(resolve, 10));
      await gdprService.grantConsent(testUserId, ConsentType.ANALYTICS);

      const consents = await gdprService.getUserConsents(testUserId);

      expect(consents).toHaveLength(2);
    });

    it('should return empty array for user with no consents', async () => {
      const consents = await gdprService.getUserConsents(testUserId);

      expect(consents).toEqual([]);
    });
  });

  describe('hasConsent', () => {
    it('should return true for granted consent', async () => {
      await gdprService.grantConsent(testUserId, ConsentType.TERMS_OF_SERVICE);

      const result = await gdprService.hasConsent(testUserId, ConsentType.TERMS_OF_SERVICE);

      expect(result).toBe(true);
    });

    it('should return false for revoked consent', async () => {
      await gdprService.grantConsent(testUserId, ConsentType.PRIVACY_POLICY);
      await gdprService.revokeConsent(testUserId, ConsentType.PRIVACY_POLICY);

      const result = await gdprService.hasConsent(testUserId, ConsentType.PRIVACY_POLICY);

      expect(result).toBe(false);
    });

    it('should return false for non-existent consent', async () => {
      const result = await gdprService.hasConsent(testUserId, ConsentType.MARKETING_EMAILS);

      expect(result).toBe(false);
    });
  });
});

