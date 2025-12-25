import { Router } from 'express';
import { body } from 'express-validator';
import * as authService from '../services/authService';
import { validate, validators } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/security';
import asyncHandler from '../utils/asyncHandler';
import config from '../config';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authLimiter,
  validate([
    validators.email,
    validators.password,
    validators.name,
  ]),
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const user = await authService.register(email, password, name, ipAddress, userAgent);

    res.status(201).json({
      success: true,
      data: user,
    });
  })
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  authLimiter,
  validate([
    validators.email,
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const { user, accessToken, refreshToken } = await authService.login(
      email,
      password,
      ipAddress,
      userAgent
    );

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: config.cookie.maxAge,
      domain: config.cookie.domain,
    });

    res.json({
      success: true,
      data: {
        user,
        accessToken,
      },
    });
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'No refresh token provided',
      });
      return;
    }

    const { accessToken } = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: { accessToken },
    });
  })
);

/**
 * POST /api/auth/logout
 * Logout user (delete session)
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      domain: config.cookie.domain,
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  })
);

/**
 * GET /api/auth/me
 * Get current user
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await authService.getUserById(req.user!.id);

    res.json({
      success: true,
      data: user,
    });
  })
);

export default router;

