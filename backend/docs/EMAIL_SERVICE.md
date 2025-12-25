# Email Service Documentation

## Overview
The Email Service provides a robust, templated email system using **Resend** as the email provider and **Handlebars** for HTML templating.

## Features
- ✅ Professional HTML email templates (Welcome, Verification, Password Reset, Notifications)
- ✅ PII protection (email masking in logs and templates)
- ✅ XSS protection (automatic HTML escaping)
- ✅ Configurable via environment variables
- ✅ Graceful degradation (works without API key in development)
- ✅ Comprehensive test coverage (12 tests, 100% passing)

## Setup

### 1. Get Resend API Key
1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Verify your sending domain

### 2. Configure Environment Variables

Add to `.env`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
APP_NAME=Your App Name
```

## Usage

### Send Welcome Email

```typescript
import { sendWelcomeEmail } from './services/emailService';

await sendWelcomeEmail({
  to: 'user@example.com',
  name: 'John Doe',
  actionUrl: 'https://app.com/dashboard', // optional
});
```

### Send Email Verification

```typescript
import { sendVerificationEmail } from './services/emailService';

await sendVerificationEmail({
  to: 'user@example.com',
  name: 'John Doe',
  token: 'verification-token-123',
});
```

### Send Password Reset

```typescript
import { sendPasswordResetEmail } from './services/emailService';

await sendPasswordResetEmail({
  to: 'user@example.com',
  name: 'John Doe',
  token: 'reset-token-456',
});
```

### Send Custom Notification

```typescript
import { sendNotificationEmail } from './services/emailService';

await sendNotificationEmail({
  to: 'user@example.com',
  subject: 'Important Update',
  title: 'New Features Available',
  message: 'Check out our latest features!',
  name: 'John Doe',
  actionUrl: 'https://app.com/features', // optional
  actionText: 'View Features', // optional
});
```

## Templates

Email templates are located in `/src/templates/emails/`:

- `welcome.hbs` - Welcome new users
- `verify-email.hbs` - Email verification
- `reset-password.hbs` - Password reset
- `notification.hbs` - Generic notifications

### Template Variables

All templates have access to:
- `name` - User's name
- `email` - User's email (automatically masked for display)
- `appName` - Application name
- `year` - Current year

Template-specific variables:
- **Welcome**: `actionUrl`
- **Verify Email**: `verificationUrl`, `expiryHours`
- **Reset Password**: `resetUrl`, `expiryHours`
- **Notification**: `title`, `message`, `subject`, `actionUrl`, `actionText`

### Custom Templates

To create a new template:

1. Create a new `.hbs` file in `/src/templates/emails/`
2. Use Handlebars syntax with `{{variable}}` for escaped content
3. Add a function in `emailService.ts` to send it

Example:

```typescript
export const sendCustomEmail = async (params: {
  to: string;
  name: string;
  customData: string;
}) => {
  const html = renderTemplate('custom-template', {
    name: params.name,
    email: params.to,
    customData: params.customData,
  });

  return sendEmail({
    to: params.to,
    subject: 'Custom Email',
    html,
  });
};
```

## Security

### PII Protection
- Emails are automatically masked in logs (e.g., `j***@example.com`)
- Emails are masked in templates when displayed

### XSS Protection
- All template variables are automatically HTML-escaped by Handlebars
- User input is sanitized before rendering

### Error Handling
- Errors are logged without exposing sensitive information
- Failed emails throw `InternalServerError` with generic message

## Testing

Run email service tests:

```bash
npm test -- emailService.test.ts
```

All tests use mocks - no real emails are sent during testing.

## Configuration Without API Key

If `RESEND_API_KEY` is not set or is the placeholder value:
- Service will log a warning
- Emails will not be sent (returns mock ID)
- Useful for local development

## Production Considerations

1. **Rate Limiting**: Resend has rate limits. Monitor usage.
2. **Error Monitoring**: Set up alerts for email failures
3. **Domain Verification**: Verify your sending domain in Resend
4. **SPF/DKIM**: Configure DNS records for deliverability
5. **Bounce Handling**: Set up webhooks for bounces/complaints

## Troubleshooting

### Emails Not Sending

1. Check `RESEND_API_KEY` is set correctly
2. Verify domain in Resend dashboard
3. Check logs for errors
4. Test API key with Resend CLI

### Emails Going to Spam

1. Verify SPF and DKIM records
2. Use verified sending domain
3. Avoid spam trigger words
4. Monitor sender reputation

### Template Not Found Error

```
Error: Email template not found: template-name
```

Solution: Ensure template file exists in `/src/templates/emails/template-name.hbs`

## API Reference

### `renderTemplate(templateName, data)`
Renders an email template with provided data.

- **Parameters**:
  - `templateName` (string) - Name of template file (without .hbs)
  - `data` (object) - Template variables
- **Returns**: HTML string
- **Throws**: Error if template not found

### `sendEmail(options)`
Internal function to send email via Resend.

- **Parameters**:
  - `to` (string) - Recipient email
  - `subject` (string) - Email subject
  - `html` (string) - HTML content
- **Returns**: Resend response object
- **Throws**: InternalServerError on failure

## Metrics & Monitoring

Consider tracking:
- Email send success/failure rate
- Email delivery time
- Template render errors
- Bounce rate
- Open rate (if using tracking)

## Future Enhancements

- [ ] Email queuing for bulk sends
- [ ] Email scheduling
- [ ] Multi-language templates (i18n)
- [ ] Email analytics integration
- [ ] SMS fallback
- [ ] Email preview in development
- [ ] A/B testing support

