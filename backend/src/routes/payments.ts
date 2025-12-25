/**
 * Payment API Routes
 */

import { Router } from 'express';
import * as paymentService from '../services/paymentService';
import { authenticate, requireRole } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';
import { PaymentStatus } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/payments
 * Create a new payment
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payment = await paymentService.createPayment({
      ...req.body,
      userId: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: payment,
    });
  })
);

/**
 * GET /api/payments
 * Get user's payments
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const status = req.query.status as PaymentStatus | undefined;

    const result = await paymentService.getUserPayments(
      req.user!.id,
      page,
      pageSize,
      status
    );

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/payments/:id
 * Get payment by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const payment = await paymentService.getPayment(req.params.id, req.user!.id);

    res.json({
      success: true,
      data: payment,
    });
  })
);

/**
 * POST /api/payments/:id/capture
 * Capture a payment
 */
router.post(
  '/:id/capture',
  asyncHandler(async (req, res) => {
    const { amount } = req.body;

    const payment = await paymentService.capturePayment(
      req.params.id,
      req.user!.id,
      amount
    );

    res.json({
      success: true,
      data: payment,
      message: 'Payment captured successfully',
    });
  })
);

/**
 * POST /api/payments/:id/refund
 * Refund a payment
 */
router.post(
  '/:id/refund',
  asyncHandler(async (req, res) => {
    const refund = await paymentService.refundPayment({
      paymentId: req.params.id,
      userId: req.user!.id,
      ...req.body,
    });

    res.json({
      success: true,
      data: refund,
      message: 'Payment refunded successfully',
    });
  })
);

/**
 * POST /api/payments/webhook/:provider
 * Handle payment webhooks from providers
 * Note: This endpoint should NOT require authentication as it's called by payment providers
 */
router.post(
  '/webhook/:provider',
  asyncHandler(async (req, res) => {
    const provider = req.params.provider.toUpperCase() as any;
    let signature = req.headers['stripe-signature'] ||
                    req.headers['x-razorpay-signature'] ||
                    req.headers['x-cashfree-signature'];
    
    // Handle array or string
    if (Array.isArray(signature)) {
      signature = signature[0];
    }

    const result = await paymentService.handleWebhook(
      provider,
      req.body,
      (signature as string) || ''
    );

    res.json({
      success: true,
      data: result,
    });
  })
);

// Admin routes - view all payments
router.get(
  '/admin/all',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (_req, res) => {
    // This would need a separate service function to get all payments
    res.json({
      success: true,
      message: 'Admin payment listing - implement as needed',
    });
  })
);

export default router;

