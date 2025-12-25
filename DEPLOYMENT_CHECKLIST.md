# Deployment Checklist - Mahimapareek.com

**Quick Reference Checklist for Deployment**

---

## Pre-Deployment

### Code & Tests
- [ ] All backend tests passing (248/248)
- [ ] All frontend tests passing (48/48)
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] Code committed and pushed

### Environment Variables
- [ ] `DATABASE_URL` configured
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` set (32+ chars)
- [ ] `FRONTEND_URL` set to production domain
- [ ] `ALLOWED_ORIGINS` set (comma-separated)
- [ ] `OPENAI_API_KEY` configured (if using AI grading)
- [ ] `RESEND_API_KEY` configured (for emails)
- [ ] All other required env vars set

### Database
- [ ] Database created
- [ ] Migrations tested locally
- [ ] Backup created
- [ ] Connection string verified

### Docker
- [ ] Backend Dockerfile tested locally
- [ ] Frontend Dockerfile tested locally
- [ ] Images build successfully
- [ ] Containers start successfully

---

## Deployment Steps

### Backend Deployment
1. [ ] Push code to repository
2. [ ] Set environment variables in DCDeploy
3. [ ] Trigger build
4. [ ] Monitor build logs
5. [ ] Verify build success
6. [ ] Check health endpoint: `GET /health`
7. [ ] Verify database connection
8. [ ] Test authentication: `POST /api/auth/login`

### Frontend Deployment
1. [ ] Set `VITE_API_URL` as Docker build argument
2. [ ] Build Docker image: `docker build --build-arg VITE_API_URL=https://backend-url.com -t frontend .`
3. [ ] Deploy container
4. [ ] Verify assets load
5. [ ] Test API connectivity
6. [ ] Verify CORS works (check browser console)

**Note**: For DCDeploy, set `VITE_API_URL` as a build argument in deployment settings.

---

## Post-Deployment Verification

### Critical Tests
- [ ] Health check returns 200
- [ ] Database connection successful
- [ ] User registration works
- [ ] User login works
- [ ] CORS configured correctly
- [ ] File upload works (if enabled)
- [ ] AI grading works (if enabled)

### Workflow Tests
- [ ] Educator can create question paper
- [ ] Student can submit answer paper
- [ ] Grading system works
- [ ] Results display correctly
- [ ] CSV export works

---

## Common Issues Quick Fix

| Issue | Quick Fix |
|-------|-----------|
| Prisma OpenSSL error | Regenerate Prisma Client in production stage |
| CORS errors | Set `ALLOWED_ORIGINS` env var and redeploy |
| Missing package-lock.json | Use conditional npm install in Dockerfile |
| Missing logs directory | Create in Dockerfile before USER switch |
| Database connection fails | Check `DATABASE_URL` and OpenSSL packages |

---

## Rollback Plan

If deployment fails:
1. [ ] Revert to previous Docker image
2. [ ] Restore database backup if needed
3. [ ] Check logs for errors
4. [ ] Fix issues
5. [ ] Redeploy

---

**Last Updated**: December 18, 2025

