import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../config/database';
import config from '../config';
import { ConflictError, UnauthorizedError, NotFoundError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate access and refresh tokens
 */
export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );

  const refreshToken = jwt.sign(
    { userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn } as SignOptions
  );

  return { accessToken, refreshToken };
};

/**
 * Register a new user
 */
export const register = async (
  email: string,
  password: string,
  name?: string,
  ipAddress?: string,
  userAgent?: string
) => {
  // Check if registration is enabled
  if (!config.features.registration) {
    throw new ForbiddenError('Registration is currently disabled');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
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
      userId: user.id,
      action: 'USER_REGISTERED',
      resource: 'users',
      resourceId: user.id,
      ipAddress,
      userAgent,
    },
  });

  logger.info('User registered', { userId: user.id, email: user.email });

  return user;
};

/**
 * Login user
 */
export const login = async (
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
) => {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new UnauthorizedError('Account is disabled');
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.password);

  if (!isValidPassword) {
    // Log failed login attempt
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_FAILED',
        resource: 'users',
        resourceId: user.id,
        ipAddress,
        userAgent,
      },
    });

    throw new UnauthorizedError('Invalid credentials');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Save refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await prisma.session.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  // Log successful login
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'users',
      resourceId: user.id,
      ipAddress,
      userAgent,
    },
  });

  logger.info('User logged in', { userId: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string) => {
  // Verify refresh token
  try {
    jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Check if session exists and is valid
  const session = await prisma.session.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  if (!session.user.isActive) {
    throw new UnauthorizedError('Account is disabled');
  }

  // Generate new access token
  const accessToken = jwt.sign(
    { userId: session.userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );

  return { accessToken };
};

/**
 * Logout user (delete session)
 */
export const logout = async (refreshToken: string) => {
  // Delete session
  await prisma.session.delete({
    where: { token: refreshToken },
  });

  logger.info('User logged out');
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

