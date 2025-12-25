/**
 * GDPR Compliance Service
 * 
 * Handles data export, deletion, and consent management
 */

import { prisma } from '../config/database';
import { DataExportStatus, DataDeletionStatus, DeletionType, ConsentType } from '@prisma/client';
import logger from '../utils/logger';
import { AppError, NotFoundError } from '../utils/errors';
import { createAuditLog } from './auditService';
import crypto from 'crypto';

/**
 * Request data export
 */
export const requestDataExport = async (userId: string) => {
  try {
    // Create export request
    const exportRequest = await prisma.dataExportRequest.create({
      data: {
        userId,
        status: DataExportStatus.PENDING,
      },
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: 'DATA_EXPORT_REQUESTED',
      resource: 'data_export_requests',
      resourceId: exportRequest.id,
    });

    logger.info('Data export requested', { userId, requestId: exportRequest.id });

    // In a real system, this would trigger a background job to generate the export
    // For now, we'll mark it as processing
    return exportRequest;
  } catch (error: any) {
    logger.error('Data export request failed', { userId, error: error.message });
    throw new AppError('Failed to request data export', 500);
  }
};

/**
 * Generate data export (collects all user data)
 */
export const generateDataExport = async (requestId: string) => {
  try {
    const request = await prisma.dataExportRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new NotFoundError('Export request not found');
    }

    // Update status to processing
    await prisma.dataExportRequest.update({
      where: { id: requestId },
      data: { status: DataExportStatus.PROCESSING },
    });

    // Collect all user data
    const userId = request.userId;

    const [
      user,
      sessions,
      auditLogs,
      notifications,
      payments,
      subscriptions,
      consentRecords,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.session.findMany({ where: { userId } }),
      prisma.auditLog.findMany({ where: { userId } }),
      prisma.notification.findMany({ where: { userId } }),
      prisma.payment.findMany({ where: { userId }, include: { refunds: true } }),
      prisma.subscription.findMany({ where: { userId } }),
      prisma.consentRecord.findMany({ where: { userId } }),
    ]);

    // Compile data export
    const exportData = {
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        role: user?.role,
        createdAt: user?.createdAt,
        updatedAt: user?.updatedAt,
      },
      sessions: sessions.map(s => ({
        id: s.id,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
      })),
      auditLogs: auditLogs.map(a => ({
        action: a.action,
        resource: a.resource,
        createdAt: a.createdAt,
        ipAddress: a.ipAddress,
      })),
      notifications: notifications.map(n => ({
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        status: n.status,
      })),
      payments: payments.map(p => ({
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt,
        refunds: p.refunds,
      })),
      subscriptions,
      consents: consentRecords,
      exportMetadata: {
        requestId,
        generatedAt: new Date().toISOString(),
        format: 'JSON',
      },
    };

    const exportJson = JSON.stringify(exportData, null, 2);
    const fileSize = Buffer.byteLength(exportJson, 'utf8');

    // In a real system, upload to S3 and get downloadUrl
    // For now, we'll simulate this
    const downloadUrl = `/api/gdpr/exports/${requestId}/download`;

    // Update request with completion
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to download

    await prisma.dataExportRequest.update({
      where: { id: requestId },
      data: {
        status: DataExportStatus.COMPLETED,
        completedAt: new Date(),
        downloadUrl,
        fileSize,
        expiresAt,
      },
    });

    logger.info('Data export generated', {
      userId,
      requestId,
      fileSize,
    });

    return {
      requestId,
      downloadUrl,
      fileSize,
      expiresAt,
      data: exportData, // Return data directly for now
    };
  } catch (error: any) {
    // Mark as failed (only if request exists)
    try {
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: DataExportStatus.FAILED,
          errorMessage: error.message,
        },
      });
    } catch (updateError) {
      // Request might not exist, that's okay
    }

    logger.error('Data export generation failed', {
      requestId,
      error: error.message,
    });

    throw error;
  }
};

/**
 * Request data deletion
 */
export const requestDataDeletion = async (
  userId: string,
  deletionType: DeletionType = DeletionType.SOFT,
  reason?: string
) => {
  try {
    // Generate confirmation token
    const confirmationToken = crypto.randomBytes(32).toString('hex');

    // Create deletion request
    const deletionRequest = await prisma.dataDeletionRequest.create({
      data: {
        userId,
        deletionType,
        reason,
        confirmationToken,
        status: DataDeletionStatus.PENDING,
      },
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: 'DATA_DELETION_REQUESTED',
      resource: 'data_deletion_requests',
      resourceId: deletionRequest.id,
      details: { deletionType, reason },
    });

    logger.info('Data deletion requested', {
      userId,
      requestId: deletionRequest.id,
      deletionType,
    });

    return {
      ...deletionRequest,
      confirmationUrl: `/api/gdpr/deletion/confirm/${confirmationToken}`,
    };
  } catch (error: any) {
    logger.error('Data deletion request failed', { userId, error: error.message });
    throw new AppError('Failed to request data deletion', 500);
  }
};

/**
 * Confirm data deletion
 */
export const confirmDataDeletion = async (confirmationToken: string) => {
  try {
    const request = await prisma.dataDeletionRequest.findUnique({
      where: { confirmationToken },
    });

    if (!request) {
      throw new NotFoundError('Deletion request not found');
    }

    if (request.status !== DataDeletionStatus.PENDING) {
      throw new AppError('Deletion request already processed', 400);
    }

    // Update status to confirmed
    await prisma.dataDeletionRequest.update({
      where: { id: request.id },
      data: {
        status: DataDeletionStatus.CONFIRMED,
        confirmedAt: new Date(),
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    });

    logger.info('Data deletion confirmed', {
      userId: request.userId,
      requestId: request.id,
    });

    return request;
  } catch (error: any) {
    logger.error('Data deletion confirmation failed', { error: error.message });
    throw error;
  }
};

/**
 * Execute data deletion
 */
export const executeDataDeletion = async (requestId: string) => {
  try {
    const request = await prisma.dataDeletionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError('Deletion request not found');
    }

    if (request.status !== DataDeletionStatus.CONFIRMED) {
      throw new AppError('Deletion request not confirmed', 400);
    }

    // Update status to processing
    await prisma.dataDeletionRequest.update({
      where: { id: requestId },
      data: { status: DataDeletionStatus.PROCESSING },
    });

    const userId = request.userId;

    // Mark deletion as completed BEFORE deleting user (to avoid cascade issues)
    await prisma.dataDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: DataDeletionStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    if (request.deletionType === DeletionType.SOFT) {
      // Soft delete - mark user as inactive and anonymize
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          email: `deleted_${userId}@deleted.local`,
          name: '[Deleted User]',
        },
      });
    } else {
      // Hard delete - permanently delete user and all related data
      // Note: deletion_requests have CASCADE, so they'll be deleted too
      await prisma.user.delete({
        where: { id: userId },
      });
    }

    logger.info('Data deletion executed', {
      userId,
      requestId,
      deletionType: request.deletionType,
    });

    return request;
  } catch (error: any) {
    // Mark as failed (only if request still exists)
    try {
      await prisma.dataDeletionRequest.update({
        where: { id: requestId },
        data: {
          status: DataDeletionStatus.FAILED,
          errorMessage: error.message,
        },
      });
    } catch (updateError) {
      // Request might have been deleted, that's okay
    }

    logger.error('Data deletion execution failed', {
      requestId,
      error: error.message,
    });

    throw error;
  }
};

/**
 * Grant consent
 */
export const grantConsent = async (
  userId: string,
  consentType: ConsentType,
  ipAddress?: string,
  userAgent?: string,
  version?: string
) => {
  try {
    const consent = await prisma.consentRecord.upsert({
      where: {
        userId_consentType: {
          userId,
          consentType,
        },
      },
      update: {
        granted: true,
        grantedAt: new Date(),
        revokedAt: null,
        ipAddress,
        userAgent,
        version,
      },
      create: {
        userId,
        consentType,
        granted: true,
        grantedAt: new Date(),
        ipAddress,
        userAgent,
        version,
      },
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: 'CONSENT_GRANTED',
      resource: 'consent_records',
      resourceId: consent.id,
      details: { consentType },
      ipAddress,
      userAgent,
    });

    logger.info('Consent granted', { userId, consentType });

    return consent;
  } catch (error: any) {
    logger.error('Grant consent failed', { userId, consentType, error: error.message });
    throw new AppError('Failed to grant consent', 500);
  }
};

/**
 * Revoke consent
 */
export const revokeConsent = async (
  userId: string,
  consentType: ConsentType,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    const consent = await prisma.consentRecord.update({
      where: {
        userId_consentType: {
          userId,
          consentType,
        },
      },
      data: {
        granted: false,
        revokedAt: new Date(),
        ipAddress,
        userAgent,
      },
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: 'CONSENT_REVOKED',
      resource: 'consent_records',
      resourceId: consent.id,
      details: { consentType },
      ipAddress,
      userAgent,
    });

    logger.info('Consent revoked', { userId, consentType });

    return consent;
  } catch (error: any) {
    logger.error('Revoke consent failed', { userId, consentType, error: error.message });
    throw error;
  }
};

/**
 * Get user consents
 */
export const getUserConsents = async (userId: string) => {
  return prisma.consentRecord.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
};

/**
 * Check if user has granted specific consent
 */
export const hasConsent = async (userId: string, consentType: ConsentType): Promise<boolean> => {
  const consent = await prisma.consentRecord.findUnique({
    where: {
      userId_consentType: {
        userId,
        consentType,
      },
    },
  });

  return consent?.granted || false;
};

/**
 * Get user's data export requests
 */
export const getUserExportRequests = async (userId: string) => {
  return prisma.dataExportRequest.findMany({
    where: { userId },
    orderBy: { requestedAt: 'desc' },
  });
};

/**
 * Get user's data deletion requests
 */
export const getUserDeletionRequests = async (userId: string) => {
  return prisma.dataDeletionRequest.findMany({
    where: { userId },
    orderBy: { requestedAt: 'desc' },
  });
};

