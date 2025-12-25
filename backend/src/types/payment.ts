/**
 * Payment Gateway Type Definitions
 * 
 * Unified types for all payment providers
 */

export type PaymentProviderType = 'STRIPE' | 'RAZORPAY' | 'CASHFREE';

export type PaymentCurrency = 'USD' | 'INR' | 'EUR' | 'GBP';

export type PaymentMethodType = 'CARD' | 'UPI' | 'NETBANKING' | 'WALLET' | 'EMI';

export interface CreatePaymentParams {
  amount: number;
  currency: PaymentCurrency;
  userId: string;
  description?: string;
  paymentMethod?: PaymentMethodType;
  metadata?: Record<string, any>;
  customerId?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: PaymentCurrency;
  status: string;
  clientSecret?: string;
  providerPaymentId: string;
  metadata?: Record<string, any>;
}

export interface CapturePaymentParams {
  paymentId: string;
  amount?: number;
}

export interface RefundPaymentParams {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface RefundResult {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
  providerRefundId: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  signature?: string;
}

export interface VerifyWebhookParams {
  payload: string | Buffer;
  signature: string;
  secret: string;
}

/**
 * Payment Provider Interface
 * All providers must implement this interface
 */
export interface IPaymentProvider {
  readonly name: PaymentProviderType;
  
  /**
   * Initialize the provider with configuration
   */
  initialize(config: Record<string, any>): void;
  
  /**
   * Create a payment intent
   */
  createPayment(params: CreatePaymentParams): Promise<PaymentIntent>;
  
  /**
   * Capture/confirm a payment
   */
  capturePayment(params: CapturePaymentParams): Promise<PaymentIntent>;
  
  /**
   * Refund a payment
   */
  refundPayment(params: RefundPaymentParams): Promise<RefundResult>;
  
  /**
   * Get payment status
   */
  getPaymentStatus(paymentId: string): Promise<PaymentIntent>;
  
  /**
   * Verify webhook signature
   */
  verifyWebhook(params: VerifyWebhookParams): boolean;
  
  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: any): WebhookEvent;
}

/**
 * Provider Configuration
 */
export interface ProviderConfig {
  provider: PaymentProviderType;
  apiKey: string;
  apiSecret?: string;
  webhookSecret?: string;
  mode?: 'test' | 'live';
}

