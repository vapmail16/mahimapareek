import { prisma } from '../config/database';
import { User, Role } from '@prisma/client';
import logger from '../utils/logger';
import { NotFoundError, ForbiddenError } from '../utils/errors';

/**
 * Role hierarchy levels (higher number = more privileges)
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  USER: 1,
  STUDENT: 1,
  EDUCATOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

/**
 * Check if user has a specific role
 */
export const hasRole = async (userId: string, role: Role): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return false;
    }

    return user.role === role;
  } catch (error: any) {
    logger.error('Error checking user role', {
      userId,
      role,
      error: error.message,
    });
    return false;
  }
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = async (
  userId: string,
  roles: Role[]
): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return false;
    }

    return roles.includes(user.role);
  } catch (error: any) {
    logger.error('Error checking user roles', {
      userId,
      roles,
      error: error.message,
    });
    return false;
  }
};

/**
 * Check if user has all of the specified roles
 * Note: Since users have only one role, this only returns true if checking single role
 */
export const hasAllRoles = async (
  userId: string,
  roles: Role[]
): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return false;
    }

    // User can only have one role, so all roles must be that one role
    return roles.length === 1 && roles[0] === user.role;
  } catch (error: any) {
    logger.error('Error checking all user roles', {
      userId,
      roles,
      error: error.message,
    });
    return false;
  }
};

/**
 * Check if user is an admin (ADMIN or SUPER_ADMIN)
 */
export const isAdmin = async (userId: string): Promise<boolean> => {
  return hasAnyRole(userId, ['ADMIN', 'SUPER_ADMIN']);
};

/**
 * Check if user is a super admin
 */
export const isSuperAdmin = async (userId: string): Promise<boolean> => {
  return hasRole(userId, 'SUPER_ADMIN');
};

/**
 * Update user role
 */
export const updateUserRole = async (
  userId: string,
  newRole: Role
): Promise<User> => {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    logger.info('User role updated', {
      userId,
      newRole,
    });

    return user;
  } catch (error: any) {
    logger.error('Failed to update user role', {
      userId,
      newRole,
      error: error.message,
    });

    if (error.code === 'P2025') {
      throw new NotFoundError('User not found');
    }

    throw error;
  }
};

/**
 * Get user's role
 */
export const getUserRole = async (userId: string): Promise<Role | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role || null;
  } catch (error: any) {
    logger.error('Error getting user role', {
      userId,
      error: error.message,
    });
    return null;
  }
};

/**
 * Get all users with a specific role
 */
export const getUsersByRole = async (role: Role): Promise<Partial<User>[]> => {
  return prisma.user.findMany({
    where: { role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

/**
 * Check if user can access a resource
 * 
 * Rules:
 * - Users can access their own resources
 * - Admins can access any resource
 * - Super admins can access any resource
 */
export const canAccessResource = async (
  userId: string,
  resourceType: string,
  resourceOwnerId: string
): Promise<boolean> => {
  try {
    // User can access own resource
    if (userId === resourceOwnerId) {
      return true;
    }

    // Check if user is admin or super admin
    const userIsAdmin = await isAdmin(userId);
    if (userIsAdmin) {
      return true;
    }

    return false;
  } catch (error: any) {
    logger.error('Error checking resource access', {
      userId,
      resourceType,
      resourceOwnerId,
      error: error.message,
    });
    return false;
  }
};

/**
 * Get role hierarchy level
 */
export const getRoleHierarchy = (role: Role): number => {
  return ROLE_HIERARCHY[role] || 0;
};

/**
 * Check if user1 has a higher role than user2
 */
export const hasHigherRole = async (
  userId1: string,
  userId2: string
): Promise<boolean> => {
  try {
    const [role1, role2] = await Promise.all([
      getUserRole(userId1),
      getUserRole(userId2),
    ]);

    if (!role1 || !role2) {
      return false;
    }

    return getRoleHierarchy(role1) > getRoleHierarchy(role2);
  } catch (error: any) {
    logger.error('Error comparing user roles', {
      userId1,
      userId2,
      error: error.message,
    });
    return false;
  }
};

/**
 * Middleware helper: Require specific role(s)
 */
export const requireRoles = async (
  userId: string,
  requiredRoles: Role[]
): Promise<void> => {
  const hasRequiredRole = await hasAnyRole(userId, requiredRoles);

  if (!hasRequiredRole) {
    throw new ForbiddenError('Insufficient permissions');
  }
};

/**
 * Middleware helper: Require admin role
 */
export const requireAdmin = async (userId: string): Promise<void> => {
  const userIsAdmin = await isAdmin(userId);

  if (!userIsAdmin) {
    throw new ForbiddenError('Admin access required');
  }
};

/**
 * Middleware helper: Require super admin role
 */
export const requireSuperAdmin = async (userId: string): Promise<void> => {
  const userIsSuperAdmin = await isSuperAdmin(userId);

  if (!userIsSuperAdmin) {
    throw new ForbiddenError('Super admin access required');
  }
};

