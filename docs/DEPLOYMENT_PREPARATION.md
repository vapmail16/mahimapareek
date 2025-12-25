# Deployment Preparation Guide - Mahimapareek.com

**Date**: December 18, 2025  
**Status**: Ready for Deployment  
**Platform**: DCDeploy (or similar containerized platform)

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Variables](#environment-variables)
3. [Docker Configuration](#docker-configuration)
4. [Database Setup](#database-setup)
5. [Build Process](#build-process)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Common Deployment Issues](#common-deployment-issues)
8. [Rollback Plan](#rollback-plan)

---

## Pre-Deployment Checklist

### Code Quality
- [x] All tests passing (Backend: 248/248, Frontend: 48/48)
- [x] No TypeScript errors
- [x] No linter errors
- [x] Code reviewed and approved
- [x] All environment variables documented

### Security
- [x] Security audit completed
- [x] All secrets in environment variables (not in code)
- [x] CORS configuration reviewed
- [x] Rate limiting configured
- [x] Input validation in place
- [x] SQL injection prevention verified (Prisma ORM)

### Database
- [x] Database migrations tested
- [x] Database schema up to date
- [x] Backup strategy in place
- [x] Connection string configured

### Dependencies
- [x] All dependencies up to date
- [x] `package-lock.json` committed
- [x] No security vulnerabilities in dependencies
- [x] Prisma Client generation tested

### Documentation
- [x] API documentation complete
- [x] Environment variables documented
- [x] Deployment process documented
- [x] Issue log updated

---

## Environment Variables

### Backend Environment Variables

**Required for Production**:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Server
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

# JWT Authentication
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# Cookies
COOKIE_DOMAIN=.your-domain.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=noreply@your-domain.com
APP_NAME=Mahimapareek

# OpenAI (for AI Grading)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# File Upload
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,txt

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# Logging
LOG_LEVEL=info
```

**Optional**:
```env
# Features
ENABLE_REGISTRATION=true
ENABLE_PASSWORD_RESET=true
ENABLE_EMAIL_VERIFICATION=false

# Architecture
ARCHITECTURE_MODE=monolithic
```

### Frontend Environment Variables

**Build-time variables** (must be set during Docker build):

```env
VITE_API_URL=https://your-backend-domain.com
```

**Note**: Vite environment variables must be prefixed with `VITE_` and are injected at build time, not runtime. They need to be passed as build arguments to Docker:

```bash
docker build --build-arg VITE_API_URL=https://your-backend-domain.com -t mahimapareek-frontend .
```

**For DCDeploy**: Set `VITE_API_URL` as a build argument in your deployment configuration.

---

## Docker Configuration

### Backend Dockerfile Checklist

Based on `DEPLOYMENT_ISSUE_LOG.md` patterns, ensure:

- [ ] **Python Packages** (if any):
  - Use `--break-system-packages` for Python 3.12+ in Alpine
  - Install build tools before compilation
  - Remove build tools after installation

- [ ] **Node.js Dependencies**:
  - Handle both `package-lock.json` present and absent cases
  - Use conditional: `if [ -f package-lock.json ]; then npm ci; else npm install; fi`

- [ ] **Prisma Client Generation**:
  - Generate Prisma Client **before** TypeScript build
  - Copy Prisma schema files early
  - **Regenerate Prisma Client in production stage** after installing OpenSSL
  - Keep `openssl-dev` during generation, remove after

- [ ] **OpenSSL for Prisma**:
  - Install `openssl` and `openssl-dev` packages
  - Keep `openssl` for runtime, remove `openssl-dev` after Prisma generation

- [ ] **Required Directories**:
  - Create `logs/` directory
  - Create `uploads/` directory (if file uploads enabled)
  - Set proper ownership and permissions

- [ ] **Build Order**:
  1. Install system dependencies
  2. Install application dependencies
  3. Generate Prisma Client (builder stage)
  4. Build TypeScript
  5. Copy to production stage
  6. Install runtime dependencies
  7. Regenerate Prisma Client (production stage)
  8. Remove build tools

### Frontend Dockerfile Checklist

- [ ] Use Node.js 18+ for build
- [ ] Copy `package.json` and `package-lock.json`
- [ ] Install dependencies
- [ ] Build application
- [ ] Use nginx or similar for serving static files
- [ ] Configure nginx for SPA routing

---

## Database Setup

### Prerequisites
- [ ] PostgreSQL 15+ installed/available
- [ ] Database created
- [ ] User with appropriate permissions
- [ ] Connection string configured

### Migration Steps
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database
npx prisma db seed
```

### Post-Migration Verification
- [ ] All tables created
- [ ] Indexes created
- [ ] Foreign keys established
- [ ] Test connection successful

---

## Build Process

### Backend Build

1. **Local Testing** (Recommended):
```bash
cd backend
docker build -t mahimapareek-backend .
docker run -p 3000:3000 --env-file .env mahimapareek-backend
```

2. **Build Verification**:
- [ ] Docker build succeeds
- [ ] No TypeScript errors
- [ ] Prisma Client generated
- [ ] All dependencies installed
- [ ] Application starts successfully

### Frontend Build

1. **Local Testing**:
```bash
cd frontend
npm run build
npm run preview  # Test production build locally
```

2. **Build Verification**:
- [ ] Build succeeds without errors
- [ ] All assets generated
- [ ] Environment variables injected
- [ ] API URL configured correctly

---

## Post-Deployment Verification

### Backend Health Checks

1. **Health Endpoint**:
```bash
curl https://your-backend-domain.com/health
```

Expected: `{"status":"ok"}`

2. **Database Connection**:
- Check logs for database connection success
- Verify no Prisma connection errors

3. **API Endpoints**:
```bash
# Test public endpoint
curl https://your-backend-domain.com/api/categories

# Test authenticated endpoint (should return 401)
curl https://your-backend-domain.com/api/auth/me
```

### Frontend Verification

1. **Static Files**:
- [ ] All assets load correctly
- [ ] No 404 errors for static files
- [ ] API calls work (check browser console)

2. **CORS Configuration**:
- [ ] Frontend can make requests to backend
- [ ] No CORS errors in browser console
- [ ] Cookies set correctly (if using)

3. **Authentication Flow**:
- [ ] Registration works
- [ ] Login works
- [ ] Protected routes require authentication
- [ ] Logout works

### Integration Testing

1. **Complete Workflow**:
- [ ] Register as educator
- [ ] Create question paper
- [ ] Add questions
- [ ] Publish paper
- [ ] Register as student
- [ ] Submit answer paper
- [ ] Grade paper
- [ ] View results
- [ ] Export CSV

---

## Common Deployment Issues

### Issue 1: Prisma OpenSSL Detection Failure

**Symptom**: 
```
Prisma failed to detect the libssl/openssl version
Failed to connect to database
```

**Solution**:
- Install `openssl` and `openssl-dev` in Dockerfile
- Regenerate Prisma Client in production stage after OpenSSL installation
- Keep `openssl` for runtime, remove `openssl-dev` after generation

### Issue 2: CORS Errors

**Symptom**:
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**:
- Set `FRONTEND_URL` environment variable
- Set `ALLOWED_ORIGINS` with comma-separated origins
- Redeploy backend after updating CORS settings
- Verify CORS middleware configuration

### Issue 3: Missing package-lock.json

**Symptom**:
```
npm ci can only install with an existing package-lock.json
```

**Solution**:
- Commit `package-lock.json` to version control
- Use conditional logic in Dockerfile:
  ```dockerfile
  RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
  ```

### Issue 4: Prisma Client Generated After TypeScript Build

**Symptom**:
```
Module '@prisma/client' has no exported member 'User'
```

**Solution**:
- Generate Prisma Client **before** TypeScript compilation
- Copy Prisma schema files early in Dockerfile
- Regenerate in production stage after OpenSSL installation

### Issue 5: Missing Logs Directory

**Symptom**:
```
Error: ENOENT: no such file or directory, open 'logs/error.log'
```

**Solution**:
- Create `logs/` directory in Dockerfile
- Set proper ownership and permissions
- Check application configuration for required directories

### Issue 6: Stripe API Version Mismatch

**Symptom**:
```
Type '"2025-11-17.clover"' is not assignable to type '"2025-12-15.clover"'
```

**Solution**:
- Remove hardcoded `apiVersion` from Stripe initialization
- Let Stripe use default version for installed package
- Or update to match package version

---

## Rollback Plan

### Backend Rollback

1. **Database Rollback**:
```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>
```

2. **Application Rollback**:
- Revert to previous Docker image tag
- Update environment variables if needed
- Restart services

### Frontend Rollback

1. **Static Files Rollback**:
- Revert to previous build
- Update CDN/static file server
- Clear browser cache if needed

### Data Backup

Before deployment:
- [ ] Database backup created
- [ ] File uploads backed up (if any)
- [ ] Configuration files backed up

---

## Deployment Steps

### Step 1: Pre-Deployment

1. Run all tests locally
2. Build Docker images locally
3. Test Docker containers
4. Verify environment variables
5. Create database backup

### Step 2: Backend Deployment

1. Push code to repository
2. Trigger build in DCDeploy
3. Monitor build logs
4. Verify build success
5. Set environment variables
6. Deploy to production
7. Verify health endpoint
8. Check database connection

### Step 3: Frontend Deployment

1. Build frontend with production API URL
2. Deploy static files
3. Verify assets load
4. Test API connectivity
5. Verify CORS configuration

### Step 4: Post-Deployment

1. Run health checks
2. Test authentication flow
3. Test critical workflows
4. Monitor error logs
5. Verify performance metrics

---

## Monitoring & Alerts

### Key Metrics to Monitor

- **Application Health**:
  - Response times
  - Error rates
  - Database connection pool
  - Memory usage

- **Business Metrics**:
  - User registrations
  - Question papers created
  - Answer papers submitted
  - Grading completion rate

### Alert Thresholds

- Response time > 2 seconds
- Error rate > 1%
- Database connection failures
- Memory usage > 80%

---

## Support & Troubleshooting

### Log Locations

- **Backend Logs**: `/app/logs/` directory
- **Application Logs**: Check DCDeploy logs
- **Database Logs**: Check PostgreSQL logs

### Common Commands

```bash
# Check application status
curl https://your-backend-domain.com/health

# View recent logs
docker logs <container-id> --tail 100

# Database connection test
npx prisma db execute --stdin < /dev/null
```

---

## Next Steps After Deployment

1. [ ] Monitor application for 24 hours
2. [ ] Set up automated backups
3. [ ] Configure monitoring alerts
4. [ ] Document production URLs
5. [ ] Update DNS records if needed
6. [ ] Set up SSL certificates
7. [ ] Configure CDN for static assets
8. [ ] Set up error tracking (Sentry, etc.)

---

**Last Updated**: December 18, 2025  
**Prepared By**: Development Team  
**Based On**: DEPLOYMENT_ISSUE_LOG.md patterns and lessons learned

