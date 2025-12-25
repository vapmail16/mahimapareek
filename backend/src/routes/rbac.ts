import { Router } from 'express';
import * as rbacService from '../services/rbacService';
import { authenticate, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/rbac/me/role
 * Get current user's role
 */
router.get(
  '/me/role',
  asyncHandler(async (req, res) => {
    const role = await rbacService.getUserRole(req.user!.id);

    return res.json({
      success: true,
      data: { role },
    });
  })
);

/**
 * GET /api/rbac/me/permissions
 * Get current user's permissions info
 */
router.get(
  '/me/permissions',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const role = await rbacService.getUserRole(userId);

    const permissions = {
      role,
      isAdmin: await rbacService.isAdmin(userId),
      isSuperAdmin: await rbacService.isSuperAdmin(userId),
      hierarchy: role ? rbacService.getRoleHierarchy(role) : 0,
    };

    return res.json({
      success: true,
      data: permissions,
    });
  })
);

/**
 * GET /api/rbac/users/role/:role
 * Get all users with a specific role (admin only)
 */
router.get(
  '/users/role/:role',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const role = req.params.role as Role;

    const users = await rbacService.getUsersByRole(role);

    return res.json({
      success: true,
      data: users,
    });
  })
);

/**
 * PUT /api/rbac/users/:userId/role
 * Update user role (super admin only)
 */
router.put(
  '/users/:userId/role',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be USER, ADMIN, or SUPER_ADMIN',
      });
    }

    const updatedUser = await rbacService.updateUserRole(userId, role as Role);

    return res.json({
      success: true,
      data: updatedUser,
      message: `User role updated to ${role}`,
    });
  })
);

/**
 * GET /api/rbac/check/role/:role
 * Check if current user has a specific role
 */
router.get(
  '/check/role/:role',
  asyncHandler(async (req, res) => {
    const role = req.params.role as Role;
    const hasRole = await rbacService.hasRole(req.user!.id, role);

    return res.json({
      success: true,
      data: { hasRole },
    });
  })
);

/**
 * POST /api/rbac/check/access
 * Check if current user can access a resource
 */
router.post(
  '/check/access',
  asyncHandler(async (req, res) => {
    const { resourceType, resourceOwnerId } = req.body;

    if (!resourceType || !resourceOwnerId) {
      return res.status(400).json({
        success: false,
        error: 'resourceType and resourceOwnerId are required',
      });
    }

    const canAccess = await rbacService.canAccessResource(
      req.user!.id,
      resourceType,
      resourceOwnerId
    );

    return res.json({
      success: true,
      data: { canAccess },
    });
  })
);

/**
 * GET /api/rbac/compare/:userId
 * Compare current user's role with another user (admin only)
 */
router.get(
  '/compare/:userId',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user!.id;

    const [currentRole, targetRole, hasHigher] = await Promise.all([
      rbacService.getUserRole(currentUserId),
      rbacService.getUserRole(userId),
      rbacService.hasHigherRole(currentUserId, userId),
    ]);

    return res.json({
      success: true,
      data: {
        currentUser: {
          id: currentUserId,
          role: currentRole,
          hierarchy: currentRole ? rbacService.getRoleHierarchy(currentRole) : 0,
        },
        targetUser: {
          id: userId,
          role: targetRole,
          hierarchy: targetRole ? rbacService.getRoleHierarchy(targetRole) : 0,
        },
        hasHigherRole: hasHigher,
      },
    });
  })
);

export default router;

