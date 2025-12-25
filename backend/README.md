# App Template - Backend

Production-ready backend template with authentication, security, and best practices built-in.

## Tech Stack

- **Node.js + TypeScript** - Type-safe backend
- **Express** - Web framework
- **Prisma** - ORM for PostgreSQL
- **JWT** - Authentication
- **Jest** - Testing
- **Winston** - Logging

## Features

✅ Authentication (register, login, refresh tokens)
✅ Security hardening (Helmet, CORS, rate limiting)
✅ Input validation
✅ Error handling
✅ Logging with PII masking
✅ Health check endpoints
✅ Audit logging
✅ TypeScript for type safety
✅ Comprehensive tests

## Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters-long
FRONTEND_URL=http://localhost:3000
```

**Important**: Use strong secrets (32+ characters) for JWT tokens.

### 3. Set Up Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Optional: Open Prisma Studio to view data
npm run prisma:studio
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

## Available Scripts

```bash
npm run dev          # Start development server with hot-reload
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint         # Run linter
npm run lint:fix     # Fix linting issues
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run database migrations
npm run prisma:studio   # Open Prisma Studio
```

## API Endpoints

### Health Check

- `GET /api/health` - Health status
- `GET /api/health/ready` - Readiness probe

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Example Request

**Register:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "name": "John Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

**Get Current User:**
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── index.ts     # App configuration
│   │   └── database.ts  # Prisma client
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # Authentication
│   │   ├── errorHandler.ts
│   │   ├── requestId.ts
│   │   ├── security.ts  # Security headers, CORS, rate limiting
│   │   └── validation.ts
│   ├── routes/          # API route handlers
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   └── health.ts
│   ├── services/        # Business logic
│   │   └── authService.ts
│   ├── utils/           # Utility functions
│   │   ├── asyncHandler.ts
│   │   ├── errors.ts    # Custom error classes
│   │   └── logger.ts    # Winston logger
│   ├── tests/           # Test utilities
│   │   └── setup.ts
│   ├── __tests__/       # Test files
│   │   └── auth.test.ts
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── logs/                # Log files (generated)
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Watch mode:
```bash
npm run test:watch
```

## Security Features

✅ **Helmet** - Security headers
✅ **CORS** - Cross-origin resource sharing
✅ **Rate Limiting** - Prevent DoS attacks
✅ **Input Validation** - express-validator
✅ **SQL Injection Prevention** - Parameterized queries (Prisma)
✅ **XSS Prevention** - Output escaping
✅ **PII Masking** - Automatic masking in logs
✅ **JWT** - Secure authentication
✅ **HTTP-only Cookies** - Refresh tokens

## Database Schema

- **users** - User accounts
- **sessions** - Refresh tokens
- **password_resets** - Password reset tokens
- **audit_logs** - Activity tracking

## Logging

Logs are stored in `logs/` directory:
- `error-YYYY-MM-DD.log` - Error logs only
- `combined-YYYY-MM-DD.log` - All logs

Logs automatically mask PII:
- Email addresses: `user@example.com` → `u***@example.com`
- Phone numbers: `+1-234-567-8900` → `+1-***-***-8900`
- Credit cards: `4111-1111-1111-1111` → `****-****-****-1111`

## Production Deployment

### Build

```bash
npm run build
```

### Environment Variables

Ensure all required environment variables are set:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - At least 32 characters
- `JWT_REFRESH_SECRET` - At least 32 characters
- `NODE_ENV=production`
- `PORT` - Server port
- `FRONTEND_URL` - Frontend URL for CORS

### Run

```bash
npm start
```

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Run migrations: `npm run prisma:migrate`

### Port Already in Use

Change `PORT` in `.env` to a different port (e.g., 3002)

### JWT Token Errors

Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are at least 32 characters long

## Next Steps

1. Add your business logic modules
2. Create new routes in `src/routes/`
3. Create services in `src/services/`
4. Write tests in `src/__tests__/`
5. Deploy to hosting provider

## License

MIT

