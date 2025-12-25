/**
 * Stripe Payment Provider
 * 
 * Implementation of IPaymentProvider for Stripe
 */

import Stripe from 'stripe';
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

export class StripeProvider implements IPaymentProvider {
  readonly name: PaymentProviderType = 'STRIPE';
  private stripe: Stripe | null = null;
  private webhookSecret: string = '';

  /**
   * Initialize Stripe with API key
   */
  initialize(config: Record<string, any>): void {
    const apiKey = config.apiKey as string;
    if (!apiKey) {
      throw new Error('Stripe API key is required');
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });

    this.webhookSecret = config.webhookSecret || '';
    logger.info('Stripe provider initialized');
  }

  /**
   * Create a payment intent
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentIntent> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const amount = Math.round(params.amount * 100); // Convert to cents

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: params.currency.toLowerCase(),
        description: params.description,
        metadata: {
          userId: params.userId,
          ...params.metadata,
        },
        customer: params.customerId,
        capture_method: 'manual', // Manual capture for review
      });

      logger.info('Stripe payment created', {
        paymentId: paymentIntent.id,
        amount: params.amount,
        currency: params.currency,
      });

      return {
        id: paymentIntent.id,
        amount: params.amount,
        currency: params.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret || undefined,
        providerPaymentId: paymentIntent.id,
        metadata: paymentIntent.metadata,
      };
    } catch (error: any) {
      logger.error('Stripe payment creation failed', {
        error: error.message,
        code: error.code,
      });
      throw error;
    }
  }

  /**
   * Capture/confirm a payment
   */
  async capturePayment(params: CapturePaymentParams): Promise<PaymentIntent> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const captureParams: Stripe.PaymentIntentCaptureParams = {};
      if (params.amount) {
        captureParams.amount_to_capture = Math.round(params.amount * 100);
      }

      const paymentIntent = await this.stripe.paymentIntents.capture(
        params.paymentId,
        captureParams
      );

      logger.info('Stripe payment captured', {
        paymentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        status: paymentIntent.status,
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase() as any,
        status: paymentIntent.status,
        providerPaymentId: paymentIntent.id,
        metadata: paymentIntent.metadata,
      };
    } catch (error: any) {
      logger.error('Stripe payment capture failed', {
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
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: params.paymentId,
      };

      if (params.amount) {
        refundParams.amount = Math.round(params.amount * 100);
      }

      if (params.reason) {
        refundParams.reason = params.reason as any;
      }

      const refund = await this.stripe.refunds.create(refundParams);

      logger.info('Stripe refund created', {
        refundId: refund.id,
        paymentId: params.paymentId,
        amount: refund.amount / 100,
        status: refund.status,
      });

      return {
        id: refund.id,
        paymentId: params.paymentId,
        amount: refund.amount / 100,
        status: refund.status || 'pending',
        providerRefundId: refund.id,
      };
    } catch (error: any) {
      logger.error('Stripe refund failed', {
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
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase() as any,
        status: paymentIntent.status,
        providerPaymentId: paymentIntent.id,
        metadata: paymentIntent.metadata,
      };
    } catch (error: any) {
      logger.error('Stripe payment status retrieval failed', {
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
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    if (!this.webhookSecret) {
      logger.warn('Stripe webhook secret not configured');
      return false;
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        params.payload,
        params.signature,
        this.webhookSecret
      );

      return !!event;
    } catch (error: any) {
      logger.error('Stripe webhook verification failed', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: any): WebhookEvent {
    const event = payload as Stripe.Event;

    return {
      id: event.id,
      type: event.type,
      data: event.data.object,
    };
  }
}

