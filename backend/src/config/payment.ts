/**
 * Payment Gateway Configuration
 */

import { PaymentProviderType, ProviderConfig } from '../types/payment';

export const paymentConfig: ProviderConfig = {
  provider: (process.env.PAYMENT_PROVIDER as PaymentProviderType) || 'STRIPE',
  apiKey: process.env.PAYMENT_API_KEY || '',
  apiSecret: process.env.PAYMENT_API_SECRET || '',
  webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || '',
  mode: (process.env.PAYMENT_MODE as 'test' | 'live') || 'test',
};

// Provider-specific configs
export const stripeConfig = {
  apiKey: process.env.STRIPE_API_KEY || process.env.PAYMENT_API_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET || '',
};

export const razorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID || process.env.PAYMENT_API_KEY || '',
  keySecret: process.env.RAZORPAY_KEY_SECRET || process.env.PAYMENT_API_SECRET || '',
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET || '',
};

export const cashfreeConfig = {
  appId: process.env.CASHFREE_APP_ID || process.env.PAYMENT_API_KEY || '',
  secretKey: process.env.CASHFREE_SECRET_KEY || process.env.PAYMENT_API_SECRET || '',
  webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET || '',
  mode: process.env.CASHFREE_MODE || process.env.PAYMENT_MODE || 'test',
};

