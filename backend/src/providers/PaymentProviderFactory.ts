/**
 * Payment Provider Factory
 * 
 * Creates and initializes the appropriate payment provider based on configuration
 */

import { IPaymentProvider, PaymentProviderType, ProviderConfig } from '../types/payment';
import { StripeProvider } from './StripeProvider';
import { RazorpayProvider } from './RazorpayProvider';
import { CashfreeProvider } from './CashfreeProvider';
import { paymentConfig, stripeConfig, razorpayConfig, cashfreeConfig } from '../config/payment';
import logger from '../utils/logger';

export class PaymentProviderFactory {
  private static instance: IPaymentProvider | null = null;

  /**
   * Get or create payment provider instance (singleton)
   */
  static getProvider(config?: ProviderConfig): IPaymentProvider {
    if (this.instance) {
      return this.instance;
    }

    const providerConfig = config || paymentConfig;
    const providerType = providerConfig.provider;

    logger.info('Initializing payment provider', { provider: providerType });

    let provider: IPaymentProvider;

    switch (providerType) {
      case 'STRIPE':
        provider = new StripeProvider();
        provider.initialize({
          apiKey: stripeConfig.apiKey,
          webhookSecret: stripeConfig.webhookSecret,
        });
        break;

      case 'RAZORPAY':
        provider = new RazorpayProvider();
        provider.initialize({
          keyId: razorpayConfig.keyId,
          keySecret: razorpayConfig.keySecret,
          webhookSecret: razorpayConfig.webhookSecret,
        });
        break;

      case 'CASHFREE':
        provider = new CashfreeProvider();
        provider.initialize({
          appId: cashfreeConfig.appId,
          secretKey: cashfreeConfig.secretKey,
          mode: cashfreeConfig.mode,
          webhookSecret: cashfreeConfig.webhookSecret,
        });
        break;

      default:
        throw new Error(`Unsupported payment provider: ${providerType}`);
    }

    this.instance = provider;
    return provider;
  }

  /**
   * Reset the provider instance (useful for testing)
   */
  static resetProvider(): void {
    this.instance = null;
  }

  /**
   * Get a specific provider without caching (for testing multiple providers)
   */
  static createProvider(providerType: PaymentProviderType, config: Record<string, any>): IPaymentProvider {
    let provider: IPaymentProvider;

    switch (providerType) {
      case 'STRIPE':
        provider = new StripeProvider();
        break;

      case 'RAZORPAY':
        provider = new RazorpayProvider();
        break;

      case 'CASHFREE':
        provider = new CashfreeProvider();
        break;

      default:
        throw new Error(`Unsupported payment provider: ${providerType}`);
    }

    provider.initialize(config);
    return provider;
  }
}

