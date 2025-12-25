/**
 * Payment Service
 * 
 * Unified payment service that works with any provider
 */

import { prisma } from '../config/database';
import { PaymentProviderFactory } from '../providers/PaymentProviderFactory';
import { CreatePaymentParams, PaymentProviderType, RefundPaymentParams } from '../types/payment';
import { PaymentStatus, PaymentProvider, Currency } from '@prisma/client';
import logger from '../utils/logger';
import { AppError, NotFoundError } from '../utils/errors';
import { createAuditLog } from './auditService';

/**
 * Create a new payment
 */
export const createPayment = async (params: CreatePaymentParams & { provider?: PaymentProviderType }) => {
  try {
    const provider = PaymentProviderFactory.getProvider();
    
    // Create payment with provider
    const paymentIntent = await provider.createPayment(params);

    // Store in database
    const payment = await prisma.payment.create({
      data: {
        userId: params.userId,
        provider: (params.provider || provider.name) as PaymentProvider,
        providerPaymentId: paymentIntent.providerPaymentId,
        amount: params.amount,
        currency: params.currency as Currency,
        status: mapProviderStatus(paymentIntent.status),
        paymentMethod: params.paymentMethod,
        description: params.description,
        metadata: paymentIntent.metadata || params.metadata,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: params.userId,
      action: 'PAYMENT_CREATED',
      resource: 'payments',
      resourceId: payment.id,
      details: {
        amount: params.amount,
        currency: params.currency,
        provider: provider.name,
      },
    });

    logger.info('Payment created', {
      paymentId: payment.id,
      userId: params.userId,
      amount: params.amount,
      provider: provider.name,
    });

    return {
      ...payment,
      clientSecret: paymentIntent.clientSecret,
    };
  } catch (error: any) {
    logger.error('Payment creation failed', {
      error: error.message,
      userId: params.userId,
    });
    throw new AppError(`Payment creation failed: ${error.message}`, 500);
  }
};

/**
 * Capture/confirm a payment
 */
export const capturePayment = async (paymentId: string, userId: string, amount?: number) => {
  try {
    // Get payment from database
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (payment.status === PaymentStatus.SUCCEEDED) {
      throw new AppError('Payment already captured', 400);
    }

    // Capture with provider
    const provider = PaymentProviderFactory.getProvider();
    const paymentIntent = await provider.capturePayment({
      paymentId: payment.providerPaymentId!,
      amount,
    });

    // Update database
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: mapProviderStatus(paymentIntent.status),
        capturedAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: 'PAYMENT_CAPTURED',
      resource: 'payments',
      resourceId: payment.id,
      details: {
        amount: amount || payment.amount,
        capturedAmount: amount,
      },
    });

    logger.info('Payment captured', {
      paymentId: payment.id,
      userId,
    });

    return updatedPayment;
  } catch (error: any) {
    logger.error('Payment capture failed', {
      error: error.message,
      paymentId,
    });
    throw error;
  }
};

/**
 * Refund a payment
 */
export const refundPayment = async (params: RefundPaymentParams & { userId: string }) => {
  try {
    // Get payment from database
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.userId !== params.userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new AppError('Payment not eligible for refund', 400);
    }

    // Create refund with provider
    const provider = PaymentProviderFactory.getProvider();
    const refundResult = await provider.refundPayment({
      paymentId: payment.providerPaymentId!,
      amount: params.amount,
      reason: params.reason,
    });

    // Store refund in database
    const refund = await prisma.paymentRefund.create({
      data: {
        paymentId: payment.id,
        providerRefundId: refundResult.providerRefundId,
        amount: refundResult.amount,
        reason: params.reason,
        status: mapProviderStatus(refundResult.status),
        processedAt: new Date(),
      },
    });

    // Update payment status
    const refundedAmount = Number(payment.refundedAmount || 0) + refundResult.amount;
    const isFullRefund = refundedAmount >= Number(payment.amount);

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        refundedAmount,
        refundedAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog({
      userId: params.userId,
      action: 'PAYMENT_REFUNDED',
      resource: 'payments',
      resourceId: payment.id,
      details: {
        refundId: refund.id,
        amount: refundResult.amount,
        reason: params.reason,
      },
    });

    logger.info('Payment refunded', {
      paymentId: payment.id,
      refundId: refund.id,
      amount: refundResult.amount,
    });

    return refund;
  } catch (error: any) {
    logger.error('Payment refund failed', {
      error: error.message,
      paymentId: params.paymentId,
    });
    throw error;
  }
};

/**
 * Get payment by ID
 */
export const getPayment = async (paymentId: string, userId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      refunds: true,
    },
  });

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  if (payment.userId !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  return payment;
};

/**
 * Get user's payments
 */
export const getUserPayments = async (
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  status?: PaymentStatus
) => {
  const skip = (page - 1) * pageSize;
  const where: any = { userId };
  
  if (status) {
    where.status = status;
  }

  const [payments, totalCount] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        refunds: true,
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
};

/**
 * Handle webhook event
 */
export const handleWebhook = async (
  provider: PaymentProviderType,
  payload: any,
  signature: string
) => {
  try {
    const providerInstance = PaymentProviderFactory.createProvider(provider, {
      apiKey: process.env[`${provider}_API_KEY`] || '',
      webhookSecret: process.env[`${provider}_WEBHOOK_SECRET`] || '',
    });

    // Verify webhook signature
    const isValid = providerInstance.verifyWebhook({
      payload,
      signature,
      secret: process.env[`${provider}_WEBHOOK_SECRET`] || '',
    });

    if (!isValid) {
      throw new AppError('Invalid webhook signature', 401);
    }

    // Parse webhook event
    const event = providerInstance.parseWebhookEvent(payload);

    // Store webhook log
    const webhookLog = await prisma.paymentWebhookLog.create({
      data: {
        provider: provider as PaymentProvider,
        eventType: event.type,
        eventId: event.id,
        payload: event.data,
        signature,
        verified: true,
        processed: false,
      },
    });

    // Process webhook based on event type
    await processWebhookEvent(webhookLog.id, event);

    logger.info('Webhook processed', {
      provider,
      eventType: event.type,
      webhookId: webhookLog.id,
    });

    return { success: true, webhookId: webhookLog.id };
  } catch (error: any) {
    logger.error('Webhook processing failed', {
      provider,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Process webhook event
 */
async function processWebhookEvent(webhookId: string, event: any) {
  // Handle different event types
  // This is provider-agnostic - implement based on your needs
  
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment.captured':
        // Update payment status
        await updatePaymentFromWebhook(event.data.id, PaymentStatus.SUCCEEDED);
        break;

      case 'payment_intent.payment_failed':
      case 'payment.failed':
        await updatePaymentFromWebhook(event.data.id, PaymentStatus.FAILED);
        break;

      case 'charge.refunded':
      case 'refund.processed':
        // Handle refund
        break;

      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }

    // Mark webhook as processed
    await prisma.paymentWebhookLog.update({
      where: { id: webhookId },
      data: { processed: true, processedAt: new Date() },
    });
  } catch (error: any) {
    await prisma.paymentWebhookLog.update({
      where: { id: webhookId },
      data: {
        processed: false,
        errorMessage: error.message,
      },
    });
    throw error;
  }
}

/**
 * Update payment from webhook
 */
async function updatePaymentFromWebhook(providerPaymentId: string, status: PaymentStatus) {
  await prisma.payment.updateMany({
    where: { providerPaymentId },
    data: { status },
  });
}

/**
 * Map provider status to our status enum
 */
function mapProviderStatus(providerStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'pending': PaymentStatus.PENDING,
    'processing': PaymentStatus.PROCESSING,
    'succeeded': PaymentStatus.SUCCEEDED,
    'success': PaymentStatus.SUCCEEDED,
    'captured': PaymentStatus.SUCCEEDED,
    'paid': PaymentStatus.SUCCEEDED,
    'SUCCESS': PaymentStatus.SUCCEEDED,
    'failed': PaymentStatus.FAILED,
    'FAILED': PaymentStatus.FAILED,
    'canceled': PaymentStatus.CANCELLED,
    'cancelled': PaymentStatus.CANCELLED,
    'refunded': PaymentStatus.REFUNDED,
  };

  return statusMap[providerStatus] || PaymentStatus.PENDING;
}

