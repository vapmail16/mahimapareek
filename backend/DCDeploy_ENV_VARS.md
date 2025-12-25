# DCDeploy Environment Variables - Copy & Paste Ready

**Date**: December 18, 2025  
**Status**: Ready for DCDeploy

---

## 📋 Copy These Values to DCDeploy

Copy the following environment variables to your DCDeploy backend service:

### Required Variables

```env
NODE_ENV=production
PORT=3000

DATABASE_URL=postgresql://user:password@host:port/database

JWT_SECRET=your-jwt-secret-minimum-32-characters-long
JWT_REFRESH_SECRET=your-jwt-refresh-secret-minimum-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

FRONTEND_URL=https://your-frontend-url.dcdeploy.cloud
ALLOWED_ORIGINS=https://your-frontend-url.dcdeploy.cloud

COOKIE_DOMAIN=.dcdeploy.cloud
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict

UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,txt

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

LOG_LEVEL=info
```

### Optional Variables (Update with your keys)

```env
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=noreply@your-domain.com
APP_NAME=Mahimapareek

ENABLE_REGISTRATION=true
ENABLE_PASSWORD_RESET=true
ENABLE_EMAIL_VERIFICATION=false
```

---

## ⚠️ Important Notes

1. **FRONTEND_URL and ALLOWED_ORIGINS**: Update these after frontend is deployed with the actual frontend URL
2. **API Keys**: Replace placeholder values with your actual keys
3. **All values are in `.env` file**: Located at `backend/.env`

---

## 🚀 Quick Steps

1. Go to DCDeploy → Your Backend Service → Environment Variables
2. Copy each variable from above
3. Paste into DCDeploy
4. Update `FRONTEND_URL` and `ALLOWED_ORIGINS` after frontend deployment
5. Deploy!

---

**Last Updated**: December 18, 2025

