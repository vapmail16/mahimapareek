# Reusable Components Reference

**Purpose**: Quick reference for components available from the template backend  
**Template Location**: `/Users/user/Desktop/AI/projects/template/backend/`  
**Last Updated**: December 18, 2025

---

## Overview

The backend template provides **60-70% of infrastructure** ready to use, including:
- ✅ Complete authentication system
- ✅ Email service (Resend)
- ✅ Payment gateways (Stripe, Razorpay, Cashfree)
- ✅ GDPR compliance
- ✅ RBAC (Role-Based Access Control)
- ✅ Audit logging
- ✅ Security middleware
- ✅ 127+ passing tests (TDD approach)

---

## 1. Authentication System ✅

### Location
- **Routes**: `src/routes/auth.ts`
- **Service**: `src/services/authService.ts`
- **Middleware**: `src/middleware/auth.ts`

### Available Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Features
- JWT tokens (access + refresh)
- HTTP-only cookies for refresh tokens
- Password hashing (bcrypt)
- Session management
- Rate limiting (5 attempts per 15 minutes)

### Usage
```typescript
// In your routes
import { authenticate } from '../middleware/auth';

router.get('/protected', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id; // From JWT token
  // Your code here
}));
```

### Extend for This Project
- Add roles: `STUDENT`, `EDUCATOR` to existing `Role` enum (USER, ADMIN, SUPER_ADMIN)

---

## 2. Email Service ✅

### Location
- **Service**: `src/services/emailService.ts`
- **Templates**: `src/templates/emails/`
- **Provider**: Resend

### Features
- Email template rendering (Handlebars)
- PII masking in logs
- Error handling
- Template management

### Usage
```typescript
import * as emailService from '../services/emailService';

await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  template: 'welcome',
  data: { name: 'John' }
});
```

### Available Templates
- Welcome email
- Password reset
- (Add more as needed)

### Configuration
```env
RESEND_API_KEY=your-resend-api-key-here
```

### Use Cases for This Project
- Password reset emails
- Grading completion notifications
- Answer paper submission confirmations
- Manual review assignments

---

## 3. Payment Gateway ✅

### Location
- **Routes**: `src/routes/payments.ts`
- **Service**: `src/services/paymentService.ts`
- **Providers**: 
  - `src/providers/StripeProvider.ts`
  - `src/providers/RazorpayProvider.ts`
  - `src/providers/CashfreeProvider.ts`

### Features
- Multiple payment providers
- Payment processing
- Webhook handling
- Refund support
- Payment history

### Available Endpoints
- `POST /api/payments/create` - Create payment
- `POST /api/payments/webhook` - Handle webhooks
- `POST /api/payments/refund` - Process refund
- `GET /api/payments/history` - Payment history

### Configuration
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Cashfree
CASHFREE_APP_ID=...
CASHFREE_SECRET_KEY=...
```

### Use Cases for This Project
- Premium features (if needed)
- Subscription plans for educators
- One-time payments

---

## 4. GDPR Compliance ✅

### Location
- **Routes**: `src/routes/gdpr.ts`
- **Service**: `src/services/gdprService.ts`

### Features
- Data export (JSON/CSV)
- Data deletion (soft/hard delete)
- Consent management
- Data portability

### Available Endpoints
- `POST /api/gdpr/export` - Export user data
- `POST /api/gdpr/delete` - Delete user data
- `GET /api/gdpr/consent` - Get consent status
- `POST /api/gdpr/consent` - Update consent

### Database Tables
- `data_export_requests` - Track export requests
- `data_deletion_requests` - Track deletion requests
- `consent_records` - Track user consent

### Use Cases for This Project
- Students can export their answer papers and grades
- Students can delete their accounts and data
- Consent tracking for data processing

---

## 5. RBAC (Role-Based Access Control) ✅

### Location
- **Routes**: `src/routes/rbac.ts`
- **Service**: `src/services/rbacService.ts`

### Features
- Role management
- Permission checking
- Role hierarchy

### Available Roles (Extend for This Project)
- `USER` - Default user
- `ADMIN` - Administrator
- `SUPER_ADMIN` - Super administrator
- **Add**: `STUDENT` - Student user
- **Add**: `EDUCATOR` - Educator user

### Usage
```typescript
import { requireRole } from '../middleware/auth';

router.post('/question-papers', 
  authenticate, 
  requireRole(['EDUCATOR', 'ADMIN']),
  asyncHandler(async (req, res) => {
    // Only educators and admins can create question papers
  })
);
```

---

## 6. Audit Logging ✅

### Location
- **Service**: `src/services/auditService.ts`
- **Model**: `AuditLog` in Prisma schema

### Features
- Track all important actions
- User activity logging
- Resource change tracking
- IP address and user agent tracking

### Usage
```typescript
import * as auditService from '../services/auditService';

await auditService.createAuditLog({
  userId: user.id,
  action: 'QUESTION_PAPER_CREATED',
  resource: 'question_papers',
  resourceId: questionPaper.id,
  details: { title: questionPaper.title },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});
```

### Use Cases for This Project
- Track question paper creation
- Track answer paper submissions
- Track grading actions
- Track manual reviews

---

## 7. Security Middleware ✅

### Location
- **Security**: `src/middleware/security.ts`
- **Validation**: `src/middleware/validation.ts`
- **Error Handler**: `src/middleware/errorHandler.ts`
- **Request ID**: `src/middleware/requestId.ts`

### Features
- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: 
  - Auth endpoints: 5 requests per 15 minutes
  - General API: 100 requests per 15 minutes
- **Input Validation**: express-validator
- **Error Handling**: Centralized error handler
- **Request ID**: Request tracking

### Usage
Already configured in `src/app.ts`:
```typescript
app.use(securityMiddleware); // Helmet, CORS, rate limiting
app.use(requestIdMiddleware); // Request ID tracking
app.use(errorHandler); // Error handling
```

---

## 8. Logging System ✅

### Location
- **Logger**: `src/utils/logger.ts`
- **Logs**: `logs/` directory

### Features
- Winston structured logging
- PII masking (email, phone, credit cards)
- Log rotation
- Separate error and combined logs

### Usage
```typescript
import logger from '../utils/logger';

logger.info('Question paper created', {
  userId: user.id,
  questionPaperId: questionPaper.id
});

logger.error('Grading failed', {
  error: error.message,
  answerPaperId: answerPaper.id
});
```

### Log Files
- `logs/error-YYYY-MM-DD.log` - Error logs only
- `logs/combined-YYYY-MM-DD.log` - All logs

---

## 9. Database Schema ✅

### Location
- **Schema**: `prisma/schema.prisma`

### Existing Tables (Reuse 100%)
- `users` - User accounts
- `sessions` - Refresh tokens
- `password_resets` - Password reset tokens
- `audit_logs` - Audit trail
- `notifications` - Notification system
- `notification_preferences` - User preferences
- `payments` - Payment records
- `payment_refunds` - Refund tracking
- `payment_webhook_logs` - Webhook events
- `subscriptions` - Subscription management
- `data_export_requests` - GDPR exports
- `data_deletion_requests` - GDPR deletions
- `consent_records` - GDPR consent

### New Tables to Add (This Project)
- `categories` - Blog categories
- `posts` - Blog posts
- `question_papers` - Question papers
- `questions` - Questions
- `answer_papers` - Answer paper submissions
- `answer_files` - Uploaded answer files
- `question_answers` - Individual question answers
- `ai_grading_results` - AI grading audit trail
- `manual_reviews` - Manual review queue

---

## 10. Testing Infrastructure ✅

### Location
- **Test Setup**: `src/tests/setup.ts`
- **Test Files**: `src/__tests__/`
- **Config**: `jest.config.js`

### Features
- Jest configuration
- Test database setup
- Test utilities
- 127+ passing tests (examples)

### Usage
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

## Integration Checklist

### Step 1: Copy Template
- [ ] Copy `src/` directory structure
- [ ] Copy `prisma/schema.prisma`
- [ ] Copy `package.json` and install dependencies
- [ ] Copy configuration files

### Step 2: Extend Schema
- [ ] Keep all existing tables
- [ ] Add new tables (blog, question papers, answer papers)
- [ ] Extend `Role` enum (add STUDENT, EDUCATOR)
- [ ] Run migrations

### Step 3: Configure Environment
- [ ] Copy `.env.example` from template
- [ ] Set `DATABASE_URL`
- [ ] Set `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Set `RESEND_API_KEY` (for email)
- [ ] Set payment gateway keys (if needed)
- [ ] Add new variables (AI/ML API keys)

### Step 4: Test Integration
- [ ] Run existing tests: `npm test`
- [ ] Verify authentication works
- [ ] Verify email service works
- [ ] Verify GDPR endpoints work
- [ ] Verify payment gateway works (if needed)

### Step 5: Extend Functionality
- [ ] Add new routes (blog, question papers, answer papers)
- [ ] Add new services (grading, file processing)
- [ ] Add new middleware (if needed)
- [ ] Write new tests (TDD approach)

---

## Quick Reference

### Template Path
```
/Users/user/Desktop/AI/projects/template/backend/
```

### Key Files
- `src/routes/auth.ts` - Authentication routes
- `src/services/authService.ts` - Auth business logic
- `src/services/emailService.ts` - Email service
- `src/services/paymentService.ts` - Payment service
- `src/services/gdprService.ts` - GDPR service
- `src/services/rbacService.ts` - RBAC service
- `src/services/auditService.ts` - Audit logging
- `src/middleware/auth.ts` - Auth middleware
- `src/middleware/security.ts` - Security middleware
- `src/utils/logger.ts` - Logging utility
- `prisma/schema.prisma` - Database schema

### Documentation
- Template README: `/template/backend/README.md`
- Email Service: `/template/backend/docs/EMAIL_SERVICE.md`
- RBAC Service: `/template/backend/docs/RBAC_SERVICE.md`

---

**Remember**: These components are **production-ready** and **fully tested**. Reuse them instead of rebuilding!

