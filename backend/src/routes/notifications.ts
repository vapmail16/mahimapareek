import { Router } from 'express';
import * as notificationService from '../services/notificationService';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/notifications
 * Get user notifications
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { unreadOnly, limit, offset } = req.query;

    const notifications = await notificationService.getUserNotifications(
      req.user!.id,
      {
        unreadOnly: unreadOnly === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      }
    );

    return res.json({
      success: true,
      data: notifications,
    });
  })
);

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user!.id);

    return res.json({
      success: true,
      data: { count },
    });
  })
);

/**
 * POST /api/notifications
 * Create a notification (admin/system use)
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { type, channel, title, message, data } = req.body;

    const notification = await notificationService.createNotification({
      userId: req.user!.id,
      type,
      channel,
      title,
      message,
      data,
    });

    return res.status(201).json({
      success: true,
      data: notification,
    });
  })
);

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user!.id
    );

    return res.json({
      success: true,
      data: notification,
    });
  })
);

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put(
  '/read-all',
  asyncHandler(async (req, res) => {
    const count = await notificationService.markAllAsRead(req.user!.id);

    return res.json({
      success: true,
      data: { count },
    });
  })
);

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await notificationService.deleteNotification(
      req.params.id,
      req.user!.id
    );

    return res.json({
      success: true,
      message: 'Notification deleted',
    });
  })
);

/**
 * GET /api/notifications/preferences
 * Get user notification preferences
 */
router.get(
  '/preferences',
  asyncHandler(async (req, res) => {
    const preferences = await notificationService.getUserPreferences(
      req.user!.id
    );

    return res.json({
      success: true,
      data: preferences,
    });
  })
);

/**
 * PUT /api/notifications/preferences
 * Update user notification preferences
 */
router.put(
  '/preferences',
  asyncHandler(async (req, res) => {
    const preferences = await notificationService.updateUserPreferences(
      req.user!.id,
      req.body
    );

    return res.json({
      success: true,
      data: preferences,
    });
  })
);

export default router;

