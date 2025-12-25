import { prisma } from '../config/database';
import logger from '../utils/logger';

/**
 * Assign ADMIN role to a user by email
 * @param email - User email address
 * @returns Updated user or null if user not found
 */
export const assignAdminRole = async (email: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logger.warn('User not found for admin role assignment', { email });
      return null;
    }

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      logger.info('User already has admin role', { email, role: user.role });
      return user;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: updatedUser.id,
        action: 'ROLE_UPDATED',
        resource: 'users',
        resourceId: updatedUser.id,
        details: {
          oldRole: user.role,
          newRole: 'ADMIN',
          updatedBy: 'system',
        },
      },
    });

    logger.info('Admin role assigned successfully', { email, userId: updatedUser.id });
    return updatedUser;
  } catch (error: any) {
    logger.error('Error assigning admin role', {
      email,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Script to assign admin role to specific email
 * Can be run directly: npx ts-node src/scripts/assignAdminRole.ts
 */
if (require.main === module) {
  const email = process.argv[2] || 'vapmail16@gmail.com';
  
  assignAdminRole(email)
    .then((user) => {
      if (user) {
        console.log(`✅ Admin role assigned to ${email}`);
        process.exit(0);
      } else {
        console.error(`❌ User not found: ${email}`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Error assigning admin role:', error);
      process.exit(1);
    });
}

