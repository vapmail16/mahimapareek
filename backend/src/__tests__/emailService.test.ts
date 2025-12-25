/**
 * Email Service Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 */

import * as emailService from '../services/emailService';
import { Resend } from 'resend';

// Mock Resend
jest.mock('resend');

describe('Email Service', () => {
  const originalEnv = process.env.RESEND_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set a valid API key for tests
    process.env.RESEND_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    // Restore original env
    process.env.RESEND_API_KEY = originalEnv;
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendWelcomeEmail({
        to: 'user@example.com',
        name: 'John Doe',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Welcome'),
        })
      );
    });

    it('should use default name if not provided', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendWelcomeEmail({
        to: 'user@example.com',
      });

      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw error if Resend fails', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('Resend API error'));
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await expect(
        emailService.sendWelcomeEmail({
          to: 'user@example.com',
          name: 'John Doe',
        })
      ).rejects.toThrow('Failed to send email');
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with token', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendVerificationEmail({
        to: 'user@example.com',
        name: 'John Doe',
        token: 'verification-token-123',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Verify'),
        })
      );
    });

    it('should include verification URL in email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendVerificationEmail({
        to: 'user@example.com',
        name: 'John',
        token: 'token123',
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('token123');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with token', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendPasswordResetEmail({
        to: 'user@example.com',
        name: 'John Doe',
        token: 'reset-token-123',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Reset'),
        })
      );
    });

    it('should include reset URL in email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendPasswordResetEmail({
        to: 'user@example.com',
        name: 'John',
        token: 'reset123',
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('reset123');
    });
  });

  describe('sendNotificationEmail', () => {
    it('should send custom notification email', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendNotificationEmail({
        to: 'user@example.com',
        subject: 'Test Notification',
        title: 'Important Update',
        message: 'This is a test message',
        name: 'John',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Test Notification',
        })
      );
    });

    it('should support action button in notification', async () => {
      const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-123' } });
      (Resend as jest.MockedClass<typeof Resend>).mockImplementation(() => ({
        emails: { send: mockSend },
      } as any));

      await emailService.sendNotificationEmail({
        to: 'user@example.com',
        subject: 'Test',
        title: 'Test',
        message: 'Message',
        name: 'John',
        actionUrl: 'https://example.com',
        actionText: 'Click Here',
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain('https://example.com');
      expect(callArgs.html).toContain('Click Here');
    });
  });

  describe('renderTemplate', () => {
    it('should render template with data', () => {
      const html = emailService.renderTemplate('welcome', {
        name: 'John',
        email: 'john@example.com',
        appName: 'TestApp',
        year: 2025,
      });

      expect(html).toContain('John');
      expect(html).toContain('j***@example.com'); // Email should be masked
      expect(html).toContain('TestApp');
    });

    it('should escape HTML in user input', () => {
      const html = emailService.renderTemplate('notification', {
        name: '<script>alert("xss")</script>',
        message: '<img src=x onerror=alert(1)>',
        appName: 'TestApp',
        title: 'Test',
        year: 2025,
      });

      expect(html).not.toContain('<script>alert');
      expect(html).not.toContain('onerror=alert'); // Should not have executable XSS
      expect(html).toContain('&lt;'); // Should be escaped
      expect(html).toContain('&gt;'); // Should be escaped
    });

    it('should throw error for invalid template', () => {
      expect(() => {
        emailService.renderTemplate('non-existent', {});
      }).toThrow();
    });
  });
});

