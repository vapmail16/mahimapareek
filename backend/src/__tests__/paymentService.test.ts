/**
 * Payment Service Tests (TDD)
 * 
 * Comprehensive tests for payment functionality
 */

import * as paymentService from '../services/paymentService';
import { prisma } from '../config/database';
import { PaymentProviderFactory } from '../providers/PaymentProviderFactory';
import { PaymentStatus } from '@prisma/client';

// Mock the provider factory
jest.mock('../providers/PaymentProviderFactory');

describe('Payment Service', () => {
  let testUserId: string;
  let mockProvider: any;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `payment-user-${Date.now()}@example.com`,
        password: 'hashedpassword',
        name: 'Payment Test User',
      },
    });
    testUserId = user.id;

    // Setup mock provider
    mockProvider = {
      name: 'STRIPE',
      createPayment: jest.fn(),
      capturePayment: jest.fn(),
      refundPayment: jest.fn(),
      getPaymentStatus: jest.fn(),
      verifyWebhook: jest.fn(),
      parseWebhookEvent: jest.fn(),
    };

    (PaymentProviderFactory.getProvider as jest.Mock).mockReturnValue(mockProvider);
    (PaymentProviderFactory.createProvider as jest.Mock).mockReturnValue(mockProvider);
  });

  afterEach(async () => {
    // Cleanup
    await prisma.payment.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a payment successfully', async () => {
      mockProvider.createPayment.mockResolvedValue({
        id: 'pi_123',
        amount: 100,
        currency: 'USD',
        status: 'pending',
        providerPaymentId: 'pi_123',
        clientSecret: 'secret_123',
      });

      const result = await paymentService.createPayment({
        amount: 100,
        currency: 'USD',
        userId: testUserId,
        description: 'Test payment',
      });

      expect(result).toBeDefined();
      expect(Number(result.amount)).toBe(100); // Prisma returns Decimal as string
      expect(result.currency).toBe('USD');
      expect(result.userId).toBe(testUserId);
      expect(result.clientSecret).toBe('secret_123');
      expect(mockProvider.createPayment).toHaveBeenCalledTimes(1);
    });

    it('should handle payment creation with metadata', async () => {
      mockProvider.createPayment.mockResolvedValue({
        id: 'pi_124',
        amount: 50,
        currency: 'USD',
        status: 'pending',
        providerPaymentId: 'pi_124',
        metadata: { orderId: 'order_123' },
      });

      const result = await paymentService.createPayment({
        amount: 50,
        currency: 'USD',
        userId: testUserId,
        metadata: { orderId: 'order_123' },
      });

      expect(result.metadata).toBeDefined();
      expect((result.metadata as any).orderId).toBe('order_123');
    });

    it('should throw error when provider fails', async () => {
      mockProvider.createPayment.mockRejectedValue(new Error('Provider error'));

      await expect(
        paymentService.createPayment({
          amount: 100,
          currency: 'USD',
          userId: testUserId,
        })
      ).rejects.toThrow();
    });

    it('should handle different currencies', async () => {
      mockProvider.createPayment.mockResolvedValue({
        id: 'pi_125',
        amount: 5000,
        currency: 'INR',
        status: 'pending',
        providerPaymentId: 'pi_125',
      });

      const result = await paymentService.createPayment({
        amount: 5000,
        currency: 'INR',
        userId: testUserId,
      });

      expect(result.currency).toBe('INR');
    });
  });

  describe('capturePayment', () => {
    let paymentId: string;

    beforeEach(async () => {
      mockProvider.createPayment.mockResolvedValue({
        id: 'pi_capture',
        amount: 100,
        currency: 'USD',
        status: 'pending',
        providerPaymentId: 'pi_capture',
      });

      const payment = await paymentService.createPayment({
        amount: 100,
        currency: 'USD',
        userId: testUserId,
      });

      paymentId = payment.id;
    });

    it('should capture a payment successfully', async () => {
      mockProvider.capturePayment.mockResolvedValue({
        id: 'pi_capture',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
        providerPaymentId: 'pi_capture',
      });

      const result = await paymentService.capturePayment(paymentId, testUserId);

      expect(result).toBeDefined();
      expect(result.status).toBe(PaymentStatus.SUCCEEDED);
      expect(result.capturedAt).toBeDefined();
      expect(mockProvider.capturePayment).toHaveBeenCalledTimes(1);
    });

    it('should not allow capturing already captured payment', async () => {
      mockProvider.capturePayment.mockResolvedValue({
        id: 'pi_capture',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
        providerPaymentId: 'pi_capture',
      });

      // First capture
      await paymentService.capturePayment(paymentId, testUserId);

      // Second capture should fail
      await expect(
        paymentService.capturePayment(paymentId, testUserId)
      ).rejects.toThrow('Payment already captured');
    });

    it('should not allow unauthorized user to capture payment', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: `other-${Date.now()}@example.com`,
          password: 'hashedpassword',
        },
      });

      await expect(
        paymentService.capturePayment(paymentId, otherUser.id)
      ).rejects.toThrow('Unauthorized');

      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should handle partial capture', async () => {
      mockProvider.capturePayment.mockResolvedValue({
        id: 'pi_capture',
        amount: 50,
        currency: 'USD',
        status: 'succeeded',
        providerPaymentId: 'pi_capture',
      });

      const result = await paymentService.capturePayment(paymentId, testUserId, 50);

      expect(result.status).toBe(PaymentStatus.SUCCEEDED);
      expect(mockProvider.capturePayment).toHaveBeenCalledWith({
        paymentId: 'pi_capture',
        amount: 50,
      });
    });
  });

  describe('refundPayment', () => {
    let paymentId: string;

    beforeEach(async () => {
      mockProvider.createPayment.mockResolvedValue({
        id: 'pi_refund',
        amount: 100,
        currency: 'USD',
        status: 'pending',
        providerPaymentId: 'pi_refund',
      });

      mockProvider.capturePayment.mockResolvedValue({
        id: 'pi_refund',
        amount: 100,
        currency: 'USD',
        status: 'succeeded',
        providerPaymentId: 'pi_refund',
      });

      const payment = await paymentService.createPayment({
        amount: 100,
        currency: 'USD',
        userId: testUserId,
      });

      paymentId = payment.id;
      await paymentService.capturePayment(paymentId, testUserId);
    });

    it('should refund a payment successfully', async () => {
      mockProvider.refundPayment.mockResolvedValue({
        id: 're_123',
        paymentId: 'pi_refund',
        amount: 100,
        status: 'succeeded',
        providerRefundId: 're_123',
      });

      const result = await paymentService.refundPayment({
        paymentId,
        userId: testUserId,
        reason: 'Customer request',
      });

      expect(result).toBeDefined();
      expect(Number(result.amount)).toBe(100); // Prisma returns Decimal as string
      expect(result.reason).toBe('Customer request');
      expect(mockProvider.refundPayment).toHaveBeenCalledTimes(1);
    });

    it('should handle partial refund', async () => {
      mockProvider.refundPayment.mockResolvedValue({
        id: 're_124',
        paymentId: 'pi_refund',
        amount: 50,
        status: 'succeeded',
        providerRefundId: 're_124',
      });

      const result = await paymentService.refundPayment({
        paymentId,
        amount: 50,
        userId: testUserId,
      });

      expect(Number(result.amount)).toBe(50); // Prisma returns Decimal as string

      // Check payment status is partially refunded
      const payment = await paymentService.getPayment(paymentId, testUserId);
      expect(payment.status).toBe(PaymentStatus.PARTIALLY_REFUNDED);
    });

    it('should not allow refund of non-succeeded payment', async () => {
      mockProvider.createPayment.mockResolvedValue({
        id: 'pi_pending',
        amount: 100,
        currency: 'USD',
        status: 'pending',
        providerPaymentId: 'pi_pending',
      });

      const pendingPayment = await paymentService.createPayment({
        amount: 100,
        currency: 'USD',
        userId: testUserId,
      });

      await expect(
        paymentService.refundPayment({
          paymentId: pendingPayment.id,
          userId: testUserId,
        })
      ).rejects.toThrow('not eligible for refund');
    });
  });

  describe('getUserPayments', () => {
    beforeEach(async () => {
      // Create multiple payments with unique IDs
      for (let i = 0; i < 5; i++) {
        mockProvider.createPayment.mockResolvedValueOnce({
          id: `pi_list_${i}`,
          amount: 100 + i,
          currency: 'USD',
          status: 'pending',
          providerPaymentId: `pi_list_${i}`,
        });

        await paymentService.createPayment({
          amount: 100 + i,
          currency: 'USD',
          userId: testUserId,
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    });

    it('should get user payments with pagination', async () => {
      const result = await paymentService.getUserPayments(testUserId, 1, 3);

      expect(result.payments).toHaveLength(3);
      expect(result.totalCount).toBe(5);
      expect(result.totalPages).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should filter payments by status', async () => {
      const result = await paymentService.getUserPayments(
        testUserId,
        1,
        10,
        PaymentStatus.PENDING
      );

      expect(result.payments.every(p => p.status === PaymentStatus.PENDING)).toBe(true);
    });

    it('should return empty array for user with no payments', async () => {
      const newUser = await prisma.user.create({
        data: {
          email: `empty-${Date.now()}@example.com`,
          password: 'password',
        },
      });

      const result = await paymentService.getUserPayments(newUser.id);

      expect(result.payments).toHaveLength(0);
      expect(result.totalCount).toBe(0);

      await prisma.user.delete({ where: { id: newUser.id } });
    });
  });

  describe('handleWebhook', () => {
    it('should process valid webhook', async () => {
      mockProvider.verifyWebhook.mockReturnValue(true);
      mockProvider.parseWebhookEvent.mockReturnValue({
        id: `evt_${Date.now()}_${Math.random()}`,
        type: 'payment_intent.succeeded',
        data: { id: 'pi_webhook_123' },
      });

      const result = await paymentService.handleWebhook(
        'STRIPE',
        { type: 'payment_intent.succeeded', data: { id: 'pi_webhook_123' } },
        'sig_123'
      );

      expect(result.success).toBe(true);
      expect(mockProvider.verifyWebhook).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid webhook signature', async () => {
      mockProvider.verifyWebhook.mockReturnValue(false);

      await expect(
        paymentService.handleWebhook('STRIPE', {}, 'invalid_sig')
      ).rejects.toThrow('Invalid webhook signature');
    });
  });
});

