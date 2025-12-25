# Environment Variables Setup

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mahimapareek_db

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Authentication (MUST be 32+ characters)
JWT_SECRET=your-jwt-secret-minimum-32-characters-long-for-production
JWT_REFRESH_SECRET=your-jwt-refresh-secret-minimum-32-characters-long-for-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Service (Resend) - Optional
RESEND_API_KEY=your-resend-api-key-here

# Payment Gateways (Optional - only if using payments)
# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Razorpay
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Cashfree
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENVIRONMENT=sandbox

# AI/ML Services (for answer grading)
OPENAI_API_KEY=your-openai-api-key-here

# File Storage (for answer paper uploads)
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,image/jpeg,image/png,text/plain
```

## Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Must be at least 32 characters
- `JWT_REFRESH_SECRET` - Must be at least 32 characters

## Optional Variables

All other variables have defaults or are optional.

