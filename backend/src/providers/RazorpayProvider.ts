/**
 * Razorpay Payment Provider
 * 
 * Implementation of IPaymentProvider for Razorpay
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import {
  IPaymentProvider,
  PaymentProviderType,
  CreatePaymentParams,
  PaymentIntent,
  CapturePaymentParams,
  RefundPaymentParams,
  RefundResult,
  VerifyWebhookParams,
  WebhookEvent,
} from '../types/payment';
import logger from '../utils/logger';

export class RazorpayProvider implements IPaymentProvider {
  readonly name: PaymentProviderType = 'RAZORPAY';
  private razorpay: Razorpay | null = null;
  private webhookSecret: string = '';

  /**
   * Initialize Razorpay with credentials
   */
  initialize(config: Record<string, any>): void {
    const keyId = config.keyId as string;
    const keySecret = config.keySecret as string;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay key_id and key_secret are required');
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    this.webhookSecret = config.webhookSecret || '';
    logger.info('Razorpay provider initialized');
  }

  /**
   * Create a payment order
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentIntent> {
    if (!this.razorpay) {
      throw new Error('Razorpay not initialized');
    }

    try {
      const amount = Math.round(params.amount * 100); // Convert to paise (for INR)

      const order = await this.razorpay.orders.create({
        amount,
        currency: params.currency,
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: params.userId,
          description: params.description || '',
          ...params.metadata,
        },
      });

      logger.info('Razorpay order created', {
        orderId: order.id,
        amount: params.amount,
        currency: params.currency,
      });

      return {
        id: order.id,
        amount: params.amount,
        currency: params.currency,
        status: order.status,
        providerPaymentId: order.id,
        metadata: order.notes,
      };
    } catch (error: any) {
      logger.error('Razorpay order creation failed', {
        error: error.message,
        code: error.error?.code,
      });
      throw error;
    }
  }

  /**
   * Capture/fetch payment details
   */
  async capturePayment(params: CapturePaymentParams): Promise<PaymentIntent> {
    if (!this.razorpay) {
      throw new Error('Razorpay not initialized');
    }

    try {
      // In Razorpay, payments are auto-captured by default
      // We fetch the payment to get its current status
      const payment = await this.razorpay.payments.fetch(params.paymentId);

      logger.info('Razorpay payment fetched', {
        paymentId: payment.id,
        amount: Number(payment.amount) / 100,
        status: payment.status,
      });

      return {
        id: payment.id,
        amount: Number(payment.amount) / 100,
        currency: payment.currency.toUpperCase() as any,
        status: payment.status,
        providerPaymentId: payment.id,
        metadata: payment.notes || {},
      };
    } catch (error: any) {
      logger.error('Razorpay payment fetch failed', {
        paymentId: params.paymentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(params: RefundPaymentParams): Promise<RefundResult> {
    if (!this.razorpay) {
      throw new Error('Razorpay not initialized');
    }

    try {
      const refundParams: any = {
        notes: {
          reason: params.reason || 'Customer requested refund',
        },
      };

      if (params.amount) {
        refundParams.amount = Math.round(params.amount * 100);
      }

      const refund = await this.razorpay.payments.refund(
        params.paymentId,
        refundParams
      );

      logger.info('Razorpay refund created', {
        refundId: refund.id,
        paymentId: params.paymentId,
        amount: Number(refund.amount || 0) / 100,
        status: refund.status,
      });

      return {
        id: refund.id,
        paymentId: params.paymentId,
        amount: Number(refund.amount || 0) / 100,
        status: refund.status || 'pending',
        providerRefundId: refund.id,
      };
    } catch (error: any) {
      logger.error('Razorpay refund failed', {
        paymentId: params.paymentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentIntent> {
    if (!this.razorpay) {
      throw new Error('Razorpay not initialized');
    }

    try {
      const payment = await this.razorpay.payments.fetch(paymentId);

      return {
        id: payment.id,
        amount: Number(payment.amount) / 100,
        currency: payment.currency.toUpperCase() as any,
        status: payment.status,
        providerPaymentId: payment.id,
        metadata: payment.notes || {},
      };
    } catch (error: any) {
      logger.error('Razorpay payment status retrieval failed', {
        paymentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(params: VerifyWebhookParams): boolean {
    if (!this.webhookSecret) {
      logger.warn('Razorpay webhook secret not configured');
      return false;
    }

    try {
      const payload = typeof params.payload === 'string' 
        ? params.payload 
        : JSON.stringify(params.payload);

      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      return expectedSignature === params.signature;
    } catch (error: any) {
      logger.error('Razorpay webhook verification failed', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: any): WebhookEvent {
    const event = payload.event || payload.eventType || 'unknown';
    const data = payload.payload || payload;

    return {
      id: data.id || `event_${Date.now()}`,
      type: event,
      data: data,
    };
  }
}

