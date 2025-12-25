import { prisma } from '../config/database';
import { AuditLog, Prisma } from '@prisma/client';
import logger from '../utils/logger';

/**
 * Create an audit log entry
 */
export const createAuditLog = async (params: {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<AuditLog> => {
  try {
    const log = await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        resource: params.resource || null,
        resourceId: params.resourceId || null,
        details: (params.details as Prisma.InputJsonValue) || Prisma.JsonNull,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });

    logger.info('Audit log created', {
      logId: log.id,
      action: log.action,
      userId: log.userId,
      resource: log.resource,
    });

    return log;
  } catch (error: any) {
    logger.error('Failed to create audit log', {
      error: error.message,
      action: params.action,
    });
    throw error;
  }
};

/**
 * Get audit logs with optional filters
 */
export const getAuditLogs = async (filters?: {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<AuditLog[]> => {
  const where: any = {};

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.action) {
    where.action = filters.action;
  }

  if (filters?.resource) {
    where.resource = filters.resource;
  }

  if (filters?.resourceId) {
    where.resourceId = filters.resourceId;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit,
    skip: filters?.offset,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
};

/**
 * Get audit log by ID
 */
export const getAuditLogById = async (id: string): Promise<AuditLog | null> => {
  return prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
};

/**
 * Get all audit logs for a specific user
 */
export const getUserAuditLogs = async (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<AuditLog[]> => {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: options?.limit,
    skip: options?.offset,
  });
};

/**
 * Get all audit logs for a specific resource
 */
export const getResourceAuditLogs = async (
  resource: string,
  resourceId?: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<AuditLog[]> => {
  const where: any = { resource };

  if (resourceId) {
    where.resourceId = resourceId;
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit,
    skip: options?.offset,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
};

/**
 * Delete audit logs older than specified days
 */
export const deleteOldAuditLogs = async (daysToKeep: number): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  logger.info('Old audit logs deleted', {
    daysToKeep,
    deletedCount: result.count,
  });

  return result.count;
};

/**
 * Get audit log statistics
 */
export const getAuditStats = async (filters?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalLogs: number;
  uniqueUsers: number;
  actionCounts: Record<string, number>;
  resourceCounts: Record<string, number>;
}> => {
  const where: any = {};

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  // Get total logs
  const totalLogs = await prisma.auditLog.count({ where });

  // Get unique users
  const uniqueUsers = await prisma.auditLog.findMany({
    where: {
      ...where,
      userId: { not: null },
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  // Get action counts
  const actionGroups = await prisma.auditLog.groupBy({
    by: ['action'],
    where,
    _count: { action: true },
  });

  const actionCounts: Record<string, number> = {};
  actionGroups.forEach((group) => {
    actionCounts[group.action] = group._count.action;
  });

  // Get resource counts
  const resourceGroups = await prisma.auditLog.groupBy({
    by: ['resource'],
    where: {
      ...where,
      resource: { not: null },
    },
    _count: { resource: true },
  });

  const resourceCounts: Record<string, number> = {};
  resourceGroups.forEach((group) => {
    if (group.resource) {
      resourceCounts[group.resource] = group._count.resource;
    }
  });

  return {
    totalLogs,
    uniqueUsers: uniqueUsers.length,
    actionCounts,
    resourceCounts,
  };
};

