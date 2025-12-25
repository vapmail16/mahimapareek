# Frontend Deployment Guide - Mahimapareek.com

**Date**: December 18, 2025  
**Status**: Ready for Deployment  
**Platform**: DCDeploy  
**Backend URL**: https://backend-452u55s7t7.dcdeploy.cloud

---

## 🎯 Overview

This guide provides step-by-step instructions for deploying the Mahimapareek frontend to DCDeploy.

**Prerequisites**:
- ✅ Backend deployed and accessible
- ✅ Backend URL: https://backend-452u55s7t7.dcdeploy.cloud
- ✅ Frontend .env updated with backend URL

---

## 📋 Pre-Deployment Checklist

### 1. Backend Status ✅
- [x] Backend deployed successfully
- [x] Backend URL: https://backend-452u55s7t7.dcdeploy.cloud
- [x] Health endpoint working
- [x] Database connected

### 2. Frontend Configuration ✅
- [x] `VITE_API_URL` set in `.env`
- [x] Dockerfile configured
- [x] nginx.conf configured for SPA routing

### 3. Build Configuration ✅
- [x] Dockerfile uses build arguments
- [x] Multi-stage build configured
- [x] Nginx serving static files

---

## 🚀 Step-by-Step Deployment

### Step 1: Create Frontend Service in DCDeploy

1. **Go to DCDeploy Dashboard**: https://dash.dcdeploy.com
2. **Click "New Service"** → **"Web Service"**
3. **Configure Service**:

   **Basic Settings**:
   - **Name**: `mahimapareek-frontend` (or your preferred name)
   - **Repository**: `https://github.com/vapmail16/mahimapareek.git`
   - **Branch**: `main`
   - **Context**: `./frontend` (important: frontend code is in frontend/ folder)

   **Build Settings**:
   - **Dockerfile Path**: `./frontend/Dockerfile` (or leave empty for auto-detect)
   - **Build Arguments**: 
     ```
     VITE_API_URL=https://backend-452u55s7t7.dcdeploy.cloud
     ```
   - **Port**: `80` (nginx default)

   **Runtime**:
   - **Machine Type**: Choose based on your needs
   - **Region**: Your preferred region

### Step 2: Set Build Arguments

**Critical**: Vite environment variables are build-time only!

In DCDeploy build settings, add:

**Build Argument**:
```
VITE_API_URL=https://backend-452u55s7t7.dcdeploy.cloud
```

**Important**: 
- This must be set as a **build argument**, not a runtime environment variable
- The value is injected during the Docker build process
- Cannot be changed after the image is built

### Step 3: Deploy

1. **Save Configuration**: Click "Save" or "Deploy"
2. **Monitor Build**: Watch build logs in real-time
3. **Expected Build Steps**:
   - Install npm packages
   - Build React application (Vite)
   - Copy to nginx stage
   - Configure nginx
   - Set up health check

4. **Build Time**: Typically 3-5 minutes

### Step 4: Verify Deployment

After deployment completes:

#### 4.1: Check Service Status
- Service should show "Running" or "Active"
- Note your frontend URL (e.g., `https://mahimapareek-frontend-xxxxx.dcdeploy.cloud`)

#### 4.2: Test Frontend
1. **Open frontend URL** in browser
2. **Check browser console** for errors
3. **Verify API calls** work (check Network tab)
4. **Test authentication** flow

#### 4.3: Verify CORS
- Check browser console for CORS errors
- If CORS errors appear, update backend `ALLOWED_ORIGINS` and redeploy backend

---

## 🔧 Step 5: Update Backend CORS

Once frontend is deployed, update backend CORS:

1. **Get Frontend URL** from DCDeploy (e.g., `https://frontend-xxxxx.dcdeploy.cloud`)
2. **Go to Backend Service** → **Environment Variables**
3. **Update**:
   ```env
   FRONTEND_URL=https://frontend-xxxxx.dcdeploy.cloud
   ALLOWED_ORIGINS=https://frontend-xxxxx.dcdeploy.cloud
   ```
4. **Redeploy Backend** (or restart service)

**Important**: CORS changes require backend redeploy to take effect.

---

## ✅ Post-Deployment Verification

### Frontend Tests

1. **Static Files Load**:
   - [ ] All CSS loads correctly
   - [ ] All JavaScript loads correctly
   - [ ] No 404 errors for assets

2. **API Connectivity**:
   - [ ] API calls succeed (check Network tab)
   - [ ] No CORS errors in console
   - [ ] Authentication requests work

3. **Application Flow**:
   - [ ] Homepage loads
   - [ ] Navigation works
   - [ ] Forms submit correctly
   - [ ] Data displays correctly

### Integration Tests

1. **Complete Workflow**:
   - [ ] User registration
   - [ ] User login
   - [ ] Question paper creation (educator)
   - [ ] Answer paper submission (student)
   - [ ] Grading workflow
   - [ ] Results display
   - [ ] CSV export

---

## 🐛 Troubleshooting

### Issue 1: API Calls Fail - Wrong URL

**Symptom**: API calls go to wrong backend URL or fail

**Solution**:
- Verify `VITE_API_URL` build argument is set correctly
- Rebuild frontend with correct build argument
- Check `frontend/src/lib/api.ts` uses `import.meta.env.VITE_API_URL`

### Issue 2: CORS Errors

**Symptom**:
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**:
1. Get frontend URL from DCDeploy
2. Update backend `FRONTEND_URL` and `ALLOWED_ORIGINS`
3. Redeploy backend
4. Clear browser cache and retry

### Issue 3: 404 Errors on Routes

**Symptom**: Direct URL access returns 404

**Solution**:
- Verify `nginx.conf` has SPA routing configured
- Check nginx configuration in Dockerfile
- Ensure all routes redirect to `index.html`

### Issue 4: Build Fails

**Symptom**: Docker build fails

**Check**:
- Build argument `VITE_API_URL` is set
- Node version compatibility
- Package.json scripts are correct

---

## 📋 Deployment Checklist

Before considering deployment complete:

- [ ] Frontend service created in DCDeploy
- [ ] Build argument `VITE_API_URL` set
- [ ] Initial deployment successful
- [ ] Frontend URL accessible
- [ ] No console errors
- [ ] API calls working
- [ ] Backend CORS updated with frontend URL
- [ ] Backend redeployed (if CORS updated)
- [ ] Authentication flow working
- [ ] Complete workflows tested

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

1. Go to frontend service → **Settings** → **Auto Deploy**
2. Enable **"Auto Deploy on Push"**
3. Select branch: `main`
4. Save

**Note**: If `VITE_API_URL` changes, you must update the build argument in DCDeploy settings.

---

## 📝 Key Points

1. **Build Arguments**: `VITE_API_URL` must be set as build argument, not runtime env var
2. **CORS**: Update backend CORS after frontend deployment
3. **SPA Routing**: Nginx configured to handle client-side routing
4. **Health Check**: Frontend has health check configured

---

## 🔗 Related Documentation

- `docs/BACKEND_DEPLOYMENT_GUIDE.md` - Backend deployment guide
- `docs/DEPLOYMENT_PREPARATION.md` - General deployment guide
- `frontend/README_DEPLOYMENT.md` - Frontend deployment details
- `frontend/Dockerfile` - Docker configuration

---

**Document Version**: 1.0  
**Created**: December 18, 2025  
**Status**: Ready to Execute  
**Backend URL**: https://backend-452u55s7t7.dcdeploy.cloud

