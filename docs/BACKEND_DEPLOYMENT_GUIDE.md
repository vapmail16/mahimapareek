# Backend Deployment Guide - Mahimapareek.com

**Date**: December 18, 2025  
**Status**: Ready for Deployment  
**Platform**: DCDeploy

---

## 🎯 Overview

This guide provides step-by-step instructions for deploying the Mahimapareek backend to DCDeploy, incorporating all lessons learned from previous deployments to avoid common issues.

**Prerequisites**:
- ✅ Database migrated to remote PostgreSQL
- ✅ All tests passing
- ✅ Dockerfile verified
- ✅ Environment variables documented

---

## 📋 Pre-Deployment Checklist

### 1. Database Migration ✅
- [x] Database connection string verified
- [x] Migrations applied to remote database
- [x] Database accessible from local machine

**Current Database**:
```
postgresql://bzxwjr:LL1{GG4Q)z@databasenew-452u55s7t7.tcp-proxy-2212.dcdeploy.cloud:30361/databasenew-db
```

### 2. Code Quality ✅
- [x] All tests passing (248/248 backend tests)
- [x] No TypeScript errors
- [x] No linter errors
- [x] Dockerfile tested locally (if possible)

### 3. Dockerfile Verification ✅

The Dockerfile includes all fixes from previous deployments:

- ✅ **Prisma Client Generation**: Generated before TypeScript build AND regenerated in production stage
- ✅ **OpenSSL**: Installed in both builder and production stages
- ✅ **Package Lock**: Handles both with and without package-lock.json
- ✅ **Logs Directory**: Created before USER switch
- ✅ **Uploads Directory**: Created for file uploads
- ✅ **Non-root User**: Security best practice
- ✅ **Health Check**: Configured

### 4. Environment Variables Ready

Prepare these values before deployment:

**Required**:
- `DATABASE_URL` - Already configured ✅
- `JWT_SECRET` - Generate 32+ character secret
- `JWT_REFRESH_SECRET` - Generate 32+ character secret
- `NODE_ENV=production`
- `PORT=3000`
- `FRONTEND_URL` - Will set after frontend deployment
- `ALLOWED_ORIGINS` - Will set after frontend deployment

**Optional**:
- `OPENAI_API_KEY` - For AI grading
- `RESEND_API_KEY` - For emails
- `LOG_LEVEL=info`

---

## 🚀 Step-by-Step Deployment

### Step 1: Generate JWT Secrets

Generate secure JWT secrets (32+ characters):

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save these values - you'll need them in Step 3.

### Step 2: Create Backend Service in DCDeploy

1. **Go to DCDeploy Dashboard**: https://dash.dcdeploy.com
2. **Click "New Service"** → **"Web Service"**
3. **Configure Service**:

   **Basic Settings**:
   - **Name**: `mahimapareek-backend` (or your preferred name)
   - **Repository**: Your GitHub repository URL
   - **Branch**: `main` (or your production branch)
   - **Context**: `./backend` (important: backend code is in backend/ folder)

   **Build Settings**:
   - **Dockerfile Path**: `./backend/Dockerfile` (or leave empty for auto-detect)
   - **Build Command**: Leave empty (Dockerfile handles build)
   - **Start Command**: Leave empty (Dockerfile CMD handles start)
   - **Port**: `3000`

   **Runtime**:
   - **Node Version**: `18` (matches Dockerfile)
   - **Machine Type**: Choose based on your needs
   - **Region**: Your preferred region

### Step 3: Set Environment Variables

Go to your service → **Environment Variables** and add:

```env
# Node Environment
NODE_ENV=production
PORT=3000

# Database (from migration)
DATABASE_URL=postgresql://bzxwjr:LL1{GG4Q)z@databasenew-452u55s7t7.tcp-proxy-2212.dcdeploy.cloud:30361/databasenew-db

# JWT Authentication (generate in Step 1)
JWT_SECRET=<your-generated-jwt-secret-32-chars-minimum>
JWT_REFRESH_SECRET=<your-generated-refresh-secret-32-chars-minimum>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL (update after frontend deployment)
FRONTEND_URL=https://your-frontend-url.dcdeploy.cloud
ALLOWED_ORIGINS=https://your-frontend-url.dcdeploy.cloud

# CORS & Cookies
COOKIE_DOMAIN=.dcdeploy.cloud
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict

# Logging
LOG_LEVEL=info

# File Upload
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,txt

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# Optional: OpenAI (for AI grading)
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# Optional: Email (Resend)
RESEND_API_KEY=<your-resend-api-key>
FROM_EMAIL=noreply@your-domain.com
APP_NAME=Mahimapareek
```

**Important Notes**:
- `DATABASE_URL` is already set from migration ✅
- `FRONTEND_URL` and `ALLOWED_ORIGINS` will be updated after frontend deployment
- JWT secrets must be 32+ characters
- All values should be set before first deployment

### Step 4: Deploy

1. **Save Configuration**: Click "Save" or "Deploy"
2. **Monitor Build**: Watch build logs in real-time
3. **Expected Build Steps**:
   - Install system dependencies (OpenSSL, etc.)
   - Install npm packages
   - Generate Prisma Client (builder stage)
   - Build TypeScript
   - Copy to production stage
   - Install production dependencies
   - Regenerate Prisma Client (production stage)
   - Create directories (logs, uploads)
   - Set up non-root user

4. **Build Time**: Typically 5-10 minutes

### Step 5: Verify Deployment

After deployment completes:

#### 5.1: Check Service Status
- Service should show "Running" or "Active"
- Note your backend URL (e.g., `https://mahimapareek-backend-xxxxx.dcdeploy.cloud`)

#### 5.2: Test Health Endpoint
```bash
curl https://your-backend-url.dcdeploy.cloud/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-18T...",
  "version": "1.0.0"
}
```

#### 5.3: Check Logs

In DCDeploy → Logs tab, verify:
- ✅ "Database connected successfully"
- ✅ "Server started on port 3000"
- ✅ "Prisma Client initialized"
- ✅ No errors or warnings

#### 5.4: Test Database Connection

Check logs for:
```
✅ Database connected successfully
```

If you see database errors:
- Verify `DATABASE_URL` is correct
- Check database is accessible
- Verify OpenSSL is installed (should be in Dockerfile)

### Step 6: Test API Endpoints

```bash
# Test public endpoint
curl https://your-backend-url.dcdeploy.cloud/api/categories

# Test auth endpoint (should return 401 without token)
curl https://your-backend-url.dcdeploy.cloud/api/auth/me

# Test registration (should return validation errors, not 500)
curl -X POST https://your-backend-url.dcdeploy.cloud/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

---

## 🔧 Post-Deployment: Update CORS (After Frontend Deployment)

Once frontend is deployed:

1. Go to backend service → **Environment Variables**
2. Update:
   ```env
   FRONTEND_URL=https://your-frontend-url.dcdeploy.cloud
   ALLOWED_ORIGINS=https://your-frontend-url.dcdeploy.cloud
   ```
3. **Redeploy** backend to apply CORS changes

**Important**: CORS changes require a backend redeploy to take effect.

---

## 🐛 Troubleshooting

### Issue 1: Build Fails - Prisma OpenSSL Error

**Symptom**:
```
Prisma failed to detect the libssl/openssl version
```

**Solution**: 
- ✅ Already fixed in Dockerfile (OpenSSL installed, Prisma regenerated in production stage)
- If still occurs, verify Dockerfile has both `openssl` and `openssl-dev` packages

### Issue 2: Build Fails - TypeScript Errors

**Symptom**:
```
Module '@prisma/client' has no exported member 'User'
```

**Solution**:
- ✅ Already fixed in Dockerfile (Prisma Client generated before TypeScript build)
- Verify build order in Dockerfile

### Issue 3: Build Fails - Missing package-lock.json

**Symptom**:
```
npm ci can only install with an existing package-lock.json
```

**Solution**:
- ✅ Already fixed in Dockerfile (conditional npm install)
- Commit `package-lock.json` to repository

### Issue 4: Runtime Error - Missing Logs Directory

**Symptom**:
```
Error: ENOENT: no such file or directory, open 'logs/error.log'
```

**Solution**:
- ✅ Already fixed in Dockerfile (logs directory created)
- Verify Dockerfile creates `/app/logs` directory

### Issue 5: Database Connection Fails

**Symptom**:
```
Failed to connect to database
PrismaClientInitializationError
```

**Check**:
1. `DATABASE_URL` is correct in environment variables
2. Database is accessible from DCDeploy
3. OpenSSL is installed (check Dockerfile)
4. Prisma Client was regenerated in production stage

**Solution**:
- Verify `DATABASE_URL` in DCDeploy environment variables
- Test connection from local machine first
- Check database firewall rules

### Issue 6: CORS Errors (After Frontend Deployment)

**Symptom**:
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**:
1. Set `FRONTEND_URL` environment variable
2. Set `ALLOWED_ORIGINS` environment variable (comma-separated if multiple)
3. **Redeploy backend** (CORS is runtime configuration)
4. Verify CORS middleware configuration

### Issue 7: Port Already in Use

**Symptom**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:
- Verify `PORT=3000` in environment variables
- Check DCDeploy port configuration matches

### Issue 8: JWT Errors

**Symptom**:
```
JsonWebTokenError: invalid signature
```

**Solution**:
- Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
- Ensure secrets are 32+ characters
- Regenerate secrets if needed

---

## ✅ Deployment Verification Checklist

After deployment, verify:

- [ ] Service status is "Running"
- [ ] Health endpoint returns 200 OK
- [ ] Database connection successful (check logs)
- [ ] No Prisma errors in logs
- [ ] API endpoints responding
- [ ] Authentication working (test login/register)
- [ ] CORS configured (after frontend deployment)
- [ ] File uploads working (if enabled)
- [ ] AI grading working (if enabled)

---

## 📊 Expected Build Output

Successful build should show:

```
Step 1: Installing system dependencies
Step 2: Installing npm packages
Step 3: Generating Prisma Client (builder)
Step 4: Building TypeScript
Step 5: Copying to production stage
Step 6: Installing production dependencies
Step 7: Regenerating Prisma Client (production)
Step 8: Creating directories
Step 9: Setting up non-root user
✅ Build successful
```

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

1. Go to service → **Settings** → **Auto Deploy**
2. Enable **"Auto Deploy on Push"**
3. Select branch: `main`
4. Save

### Manual Redeploy

1. Go to service → **Deploy** tab
2. Click **"Redeploy"**
3. Monitor build logs

---

## 📝 Next Steps

After backend is deployed:

1. **Deploy Frontend** (see frontend deployment guide)
2. **Update CORS** in backend with frontend URL
3. **Test Complete Flow**:
   - User registration
   - User login
   - Question paper creation
   - Answer paper submission
   - Grading workflow
   - Results display
4. **Set Up Monitoring** (optional)
5. **Configure Custom Domain** (optional)

---

## 🔗 Related Documentation

- `DEPLOYMENT_PREPARATION.md` - General deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Quick reference checklist
- `DATABASE_SETUP.md` - Database migration guide
- `backend/Dockerfile` - Docker configuration

---

## 📋 Key Lessons from Previous Deployments

Based on Sahadeva deployment experience:

1. ✅ **Prisma OpenSSL**: Regenerate Prisma Client in production stage after OpenSSL installation
2. ✅ **Build Order**: Generate Prisma Client before TypeScript compilation
3. ✅ **Package Lock**: Handle both with and without package-lock.json
4. ✅ **Directories**: Create all required directories (logs, uploads) in Dockerfile
5. ✅ **CORS**: Configure for production URLs before frontend deployment
6. ✅ **Environment Variables**: Set all required variables before first deployment

---

**Document Version**: 1.0  
**Created**: December 18, 2025  
**Status**: Ready to Execute  
**Based On**: Sahadeva deployment experience and best practices

