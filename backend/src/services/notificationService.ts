import { prisma } from '../config/database';
import { NotificationType, NotificationChannel, Notification, NotificationPreference, Prisma } from '@prisma/client';
import * as emailService from './emailService';
import logger from '../utils/logger';
import { NotFoundError, ForbiddenError } from '../utils/errors';

/**
 * Create a notification
 */
export const createNotification = async (params: {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: Record<string, any>;
}): Promise<Notification> => {
  // Get user preferences
  const preferences = await getUserPreferences(params.userId);

  // Check if channel is enabled
  const isChannelEnabled =
    (params.channel === 'EMAIL' && preferences.emailEnabled) ||
    (params.channel === 'IN_APP' && preferences.inAppEnabled) ||
    (params.channel === 'SMS' && preferences.smsEnabled);

  // Create notification
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      channel: params.channel,
      title: params.title,
      message: params.message,
      data: (params.data as Prisma.InputJsonValue) || Prisma.JsonNull,
      status: 'PENDING',
    },
  });

  // Send notification if channel is enabled
  if (isChannelEnabled) {
    try {
      if (params.channel === 'EMAIL') {
        const user = await prisma.user.findUnique({
          where: { id: params.userId },
        });

        if (user) {
          await emailService.sendNotificationEmail({
            to: user.email,
            name: user.name || undefined,
            subject: params.title,
            title: params.title,
            message: params.message,
          });

          // Update status to SENT
          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
            },
          });

          logger.info('Email notification sent', {
            notificationId: notification.id,
            userId: params.userId,
          });
        }
      } else if (params.channel === 'IN_APP') {
        // In-app notifications are immediately "sent" (visible)
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });
      }
      // SMS would be implemented here
    } catch (error: any) {
      logger.error('Failed to send notification', {
        notificationId: notification.id,
        error: error.message,
      });

      // Update status to FAILED
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'FAILED' },
      });
    }
  } else {
    logger.info('Notification not sent - channel disabled', {
      notificationId: notification.id,
      channel: params.channel,
    });
  }

  return prisma.notification.findUniqueOrThrow({
    where: { id: notification.id },
  });
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<Notification[]> => {
  const where: any = { userId };

  if (options?.unreadOnly) {
    where.status = { not: 'READ' };
  }

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit,
    skip: options?.offset,
  });
};

/**
 * Mark notification as read
 */
export const markAsRead = async (
  notificationId: string,
  userId: string
): Promise<Notification> => {
  // Verify ownership
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  if (notification.userId !== userId) {
    throw new ForbiddenError('Cannot mark another user\'s notification');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: 'READ',
      readAt: new Date(),
    },
  });
};

/**
 * Mark all user notifications as read
 */
export const markAllAsRead = async (userId: string): Promise<number> => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      status: { not: 'READ' },
    },
    data: {
      status: 'READ',
      readAt: new Date(),
    },
  });

  return result.count;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  return prisma.notification.count({
    where: {
      userId,
      status: { not: 'READ' },
    },
  });
};

/**
 * Delete notification
 */
export const deleteNotification = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  // Verify ownership
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  if (notification.userId !== userId) {
    throw new ForbiddenError('Cannot delete another user\'s notification');
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });
};

/**
 * Get user notification preferences
 */
export const getUserPreferences = async (
  userId: string
): Promise<NotificationPreference> => {
  let preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  // Create default preferences if not exist
  if (!preferences) {
    preferences = await prisma.notificationPreference.create({
      data: {
        userId,
        emailEnabled: true,
        inAppEnabled: true,
        smsEnabled: false,
      },
    });
  }

  return preferences;
};

/**
 * Update user notification preferences
 */
export const updateUserPreferences = async (
  userId: string,
  updates: {
    emailEnabled?: boolean;
    inAppEnabled?: boolean;
    smsEnabled?: boolean;
  }
): Promise<NotificationPreference> => {
  // Ensure preferences exist
  await getUserPreferences(userId);

  return prisma.notificationPreference.update({
    where: { userId },
    data: updates,
  });
};

