/**
 * Notification Service Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 */

import * as notificationService from '../services/notificationService';
import { prisma } from '../config/database';
import * as emailService from '../services/emailService';

// Mock email service
jest.mock('../services/emailService');

describe('Notification Service', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
      },
    });
    testUserId = user.id;

    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup
    await prisma.notification.deleteMany({ where: { userId: testUserId } });
    await prisma.notificationPreference.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  describe('createNotification', () => {
    it('should create in-app notification', async () => {
      const notification = await notificationService.createNotification({
        userId: testUserId,
        type: 'INFO',
        channel: 'IN_APP',
        title: 'Test Notification',
        message: 'This is a test',
      });

      expect(notification).toBeDefined();
      expect(notification.userId).toBe(testUserId);
      expect(notification.title).toBe('Test Notification');
      expect(notification.status).toBe('SENT'); // In-app notifications are immediately sent
    });

    it('should create email notification and send email', async () => {
      (emailService.sendNotificationEmail as jest.Mock).mockResolvedValue({ data: { id: 'email-123' } });

      const notification = await notificationService.createNotification({
        userId: testUserId,
        type: 'SUCCESS',
        channel: 'EMAIL',
        title: 'Welcome!',
        message: 'Thanks for joining',
      });

      expect(notification.channel).toBe('EMAIL');
      expect(emailService.sendNotificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          title: 'Welcome!',
          message: 'Thanks for joining',
        })
      );
    });

    it('should respect user notification preferences', async () => {
      // Disable email notifications
      await prisma.notificationPreference.create({
        data: {
          userId: testUserId,
          emailEnabled: false,
          inAppEnabled: true,
        },
      });

      const notification = await notificationService.createNotification({
        userId: testUserId,
        type: 'INFO',
        channel: 'EMAIL',
        title: 'Test',
        message: 'Test',
      });

      expect(notification.status).toBe('PENDING');
      expect(emailService.sendNotificationEmail).not.toHaveBeenCalled();
    });

    it('should store additional data as JSON', async () => {
      const notification = await notificationService.createNotification({
        userId: testUserId,
        type: 'INFO',
        channel: 'IN_APP',
        title: 'Test',
        message: 'Test',
        data: { orderId: '123', amount: 99.99 },
      });

      expect(notification.data).toEqual({ orderId: '123', amount: 99.99 });
    });
  });

  describe('getUserNotifications', () => {
    beforeEach(async () => {
      // Create multiple notifications with delays to ensure ordering
      await prisma.notification.create({
        data: {
          userId: testUserId,
          type: 'INFO',
          channel: 'IN_APP',
          status: 'SENT',
          title: 'Notification 1',
          message: 'Message 1',
        },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await prisma.notification.create({
        data: {
          userId: testUserId,
          type: 'SUCCESS',
          channel: 'IN_APP',
          status: 'READ',
          title: 'Notification 2',
          message: 'Message 2',
        },
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await prisma.notification.create({
        data: {
          userId: testUserId,
          type: 'WARNING',
          channel: 'IN_APP',
          status: 'SENT',
          title: 'Notification 3',
          message: 'Message 3',
        },
      });
    });

    it('should get all user notifications', async () => {
      const notifications = await notificationService.getUserNotifications(testUserId);

      expect(notifications).toHaveLength(3);
      expect(notifications[0].title).toBe('Notification 3'); // Most recent first
    });

    it('should filter unread notifications', async () => {
      const notifications = await notificationService.getUserNotifications(testUserId, {
        unreadOnly: true,
      });

      expect(notifications).toHaveLength(2);
      expect(notifications.every((n: any) => n.status !== 'READ')).toBe(true);
    });

    it('should paginate results', async () => {
      const notifications = await notificationService.getUserNotifications(testUserId, {
        limit: 2,
        offset: 1,
      });

      expect(notifications).toHaveLength(2);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: testUserId,
          type: 'INFO',
          channel: 'IN_APP',
          status: 'SENT',
          title: 'Test',
          message: 'Test',
        },
      });

      const updated = await notificationService.markAsRead(notification.id, testUserId);

      expect(updated.status).toBe('READ');
      expect(updated.readAt).toBeDefined();
    });

    it('should not allow marking another user\'s notification', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          password: 'hashedpassword',
        },
      });

      const notification = await prisma.notification.create({
        data: {
          userId: otherUser.id,
          type: 'INFO',
          channel: 'IN_APP',
          status: 'SENT',
          title: 'Test',
          message: 'Test',
        },
      });

      await expect(
        notificationService.markAsRead(notification.id, testUserId)
      ).rejects.toThrow();

      // Cleanup
      await prisma.notification.deleteMany({ where: { userId: otherUser.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      await prisma.notification.createMany({
        data: [
          {
            userId: testUserId,
            type: 'INFO',
            channel: 'IN_APP',
            status: 'SENT',
            title: 'Test 1',
            message: 'Test 1',
          },
          {
            userId: testUserId,
            type: 'INFO',
            channel: 'IN_APP',
            status: 'SENT',
            title: 'Test 2',
            message: 'Test 2',
          },
        ],
      });

      const count = await notificationService.markAllAsRead(testUserId);

      expect(count).toBe(2);

      const notifications = await prisma.notification.findMany({
        where: { userId: testUserId },
      });
      expect(notifications.every((n: any) => n.status === 'READ')).toBe(true);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      await prisma.notification.createMany({
        data: [
          {
            userId: testUserId,
            type: 'INFO',
            channel: 'IN_APP',
            status: 'SENT',
            title: 'Test 1',
            message: 'Test 1',
          },
          {
            userId: testUserId,
            type: 'INFO',
            channel: 'IN_APP',
            status: 'READ',
            title: 'Test 2',
            message: 'Test 2',
          },
          {
            userId: testUserId,
            type: 'INFO',
            channel: 'IN_APP',
            status: 'SENT',
            title: 'Test 3',
            message: 'Test 3',
          },
        ],
      });

      const count = await notificationService.getUnreadCount(testUserId);

      expect(count).toBe(2);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: testUserId,
          type: 'INFO',
          channel: 'IN_APP',
          status: 'SENT',
          title: 'Test',
          message: 'Test',
        },
      });

      await notificationService.deleteNotification(notification.id, testUserId);

      const deleted = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('getUserPreferences', () => {
    it('should get user notification preferences', async () => {
      const prefs = await notificationService.getUserPreferences(testUserId);

      expect(prefs).toBeDefined();
      expect(prefs.emailEnabled).toBe(true);
      expect(prefs.inAppEnabled).toBe(true);
    });

    it('should create default preferences if not exist', async () => {
      const prefs = await notificationService.getUserPreferences(testUserId);

      expect(prefs.userId).toBe(testUserId);
      expect(prefs.emailEnabled).toBe(true);
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user notification preferences', async () => {
      const updated = await notificationService.updateUserPreferences(testUserId, {
        emailEnabled: false,
        smsEnabled: true,
      });

      expect(updated.emailEnabled).toBe(false);
      expect(updated.smsEnabled).toBe(true);
      expect(updated.inAppEnabled).toBe(true); // Unchanged
    });
  });
});

