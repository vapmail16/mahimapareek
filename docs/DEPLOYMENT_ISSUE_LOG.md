# Deployment Issue Log - Sahadeva Backend

**Date**: December 18, 2025  
**Platform**: DCDeploy  
**Status**: Resolved

---

## Overview

This document logs all deployment issues encountered during the initial deployment of Sahadeva backend to DCDeploy, along with their solutions and prevention strategies.

---

## Issue #1: Python 3.12+ Externally Managed Environment (PEP 668)

**Date**: December 18, 2025  
**Build Version**: v1  
**Status**: ✅ Resolved

### Error Message
```
error: externally-managed-environment

× This environment is externally managed
╰─> 
    The system-wide python installation should be maintained using the system
    package manager (apk) only.
    
note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at your risk of breaking your Python installation or OS, by passing --break-system-packages.
```

### Root Cause
Python 3.12+ in Alpine Linux implements PEP 668, which prevents installing packages system-wide using `pip` to avoid conflicts with system package manager.

### Solution
Added `--break-system-packages` flag to pip install command:
```dockerfile
RUN pip3 install --no-cache-dir --break-system-packages pyswisseph
```

### How to Avoid
- **Always use `--break-system-packages`** when installing Python packages with pip in Alpine Linux containers (Python 3.12+)
- This is safe in Docker containers since they are isolated environments
- Alternative: Use virtual environments, but not necessary for containerized deployments

### Files Changed
- `backend/Dockerfile` (line 48)

---

## Issue #2: Missing Build Tools for pyswisseph Compilation

**Date**: December 18, 2025  
**Build Version**: v2  
**Status**: ✅ Resolved

### Error Message
```
error: command 'gcc' failed: No such file or directory

Building wheel for pyswisseph (pyproject.toml): started
...
gcc -fno-strict-overflow -Wsign-compare -DNDEBUG -g -O3 -Wall -fPIC ...
error: command 'gcc' failed: No such file or directory
```

### Root Cause
`pyswisseph` needs to be compiled from source and requires build tools (`gcc`, `g++`, `make`, `musl-dev`, `python3-dev`) which were not installed in the production stage of the Dockerfile.

### Solution
Added build tools to production stage, install pyswisseph, then remove build tools to reduce image size:
```dockerfile
# Install Python 3, build tools, and runtime dependencies for Swiss Ephemeris
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    gcc \
    g++ \
    make \
    musl-dev \
    postgresql-client \
    curl

# Install Swiss Ephemeris Python package
RUN pip3 install --no-cache-dir --break-system-packages pyswisseph

# Remove build tools to reduce image size
RUN apk del gcc g++ make musl-dev python3-dev
```

### How to Avoid
- **Check if Python packages need compilation** before deployment
- For packages that compile from source (like `pyswisseph`), ensure build tools are available during installation
- **Remove build tools after installation** to keep Docker image size small
- Test locally or check package documentation for build requirements

### Files Changed
- `backend/Dockerfile` (lines 40-58)

---

## Issue #3: Missing package-lock.json in Build Context

**Date**: December 18, 2025  
**Build Version**: v3  
**Status**: ✅ Resolved

### Error Message
```
npm error The `npm ci` command can only install with an existing package-lock.json or
npm error npm-shrinkwrap.json with lockfileVersion >= 1. Run an install with npm@5 or
npm error later to generate a package-lock.json file, then try again.
```

### Root Cause
The Dockerfile used `npm ci` which requires `package-lock.json`, but the file wasn't being copied to the Docker build context, or DCDeploy's build context didn't include it.

### Solution
Made the Dockerfile handle both cases (with and without `package-lock.json`):
```dockerfile
# Copy package files (including package-lock.json if it exists)
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies - use npm ci if lock file exists, otherwise npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
```

### How to Avoid
- **Always commit `package-lock.json`** to version control for reproducible builds
- **Use conditional logic** in Dockerfile to handle both cases
- **Test with and without `package-lock.json`** to ensure Dockerfile is robust
- Consider using `npm install` instead of `npm ci` if lock file availability is uncertain

### Files Changed
- `backend/Dockerfile` (lines 19-24, 61-65)

---

## Issue #4: Prisma Client Generated After TypeScript Build

**Date**: December 18, 2025  
**Build Version**: v5  
**Status**: ✅ Resolved

### Error Message
```
src/astrology/repositories/matching.repository.ts(11,10): error TS2305: Module '"@prisma/client"' has no exported member 'Matching'.
src/astrology/repositories/profile.repository.ts(9,10): error TS2305: Module '"@prisma/client"' has no exported member 'Gender'.
src/astrology/repositories/profile.repository.ts(9,18): error TS2305: Module '"@prisma/client"' has no exported member 'Profile'.
src/services/rbacService.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
src/services/rbacService.ts(2,16): error TS2305: Module '"@prisma/client"' has no exported member 'Role'.
... (many more similar errors)
```

### Root Cause
The Dockerfile was trying to build TypeScript code before generating Prisma Client. TypeScript needs the Prisma-generated types (User, Profile, Gender, etc.) to compile successfully.

### Solution
Reordered the build steps to generate Prisma Client before building TypeScript:
```dockerfile
# Copy Prisma schema first (needed for generating client)
COPY prisma ./prisma

# Generate Prisma Client BEFORE building TypeScript
# TypeScript needs Prisma types to compile
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build
```

### How to Avoid
- **Always generate Prisma Client before TypeScript compilation**
- **Copy Prisma schema files before source code** to enable early client generation
- **Order matters in Dockerfiles**: Dependencies must be available before they're used
- Test the build order locally or use multi-stage builds effectively

### Files Changed
- `backend/Dockerfile` (lines 27-34)

---

## Issue #5: Missing Logs Directory

**Date**: December 18, 2025  
**Build Version**: v1 (prevented)  
**Status**: ✅ Resolved (Prevented)

---

## Issue #6: Stripe API Version Mismatch

**Date**: December 18, 2025  
**Build Version**: v7  
**Status**: ✅ Resolved

### Error Message
```
src/providers/StripeProvider.ts(36,7): error TS2322: Type '"2025-11-17.clover"' is not assignable to type '"2025-12-15.clover"'.
```

### Root Cause
The Stripe API version in the code (`2025-11-17.clover`) doesn't match the API version expected by the installed Stripe package (`2025-12-15.clover`). This happens when the Stripe package is updated but the hardcoded API version in the code isn't updated.

### Solution
Removed the hardcoded API version to let Stripe use the default for the installed package:
```typescript
this.stripe = new Stripe(apiKey, {
  // Don't specify apiVersion - let Stripe use the default for the installed package version
  // This avoids version mismatch errors when the package is updated
  typescript: true,
});
```

### How to Avoid
- **Don't hardcode Stripe API versions** - Let Stripe use the default version for the installed package
- **Or use the latest API version** that matches your Stripe package version
- **Check Stripe package changelog** when updating the package
- **Consider removing apiVersion** parameter to use Stripe's default (recommended)
- **Test TypeScript compilation** after updating payment provider packages

### Alternative Solution (Recommended)
Remove the `apiVersion` parameter to let Stripe use the default version for your package:
```typescript
this.stripe = new Stripe(apiKey, {
  typescript: true,
  // apiVersion will use the default for the installed package version
});
```

### Files Changed
- `backend/src/providers/StripeProvider.ts` (line 36)

---

## Issue #7: Prisma OpenSSL Detection Failure and Database Connection Error

**Date**: December 18, 2025  
**Build Version**: v9  
**Status**: ✅ Resolved

### Error Message
```
prisma:warn Prisma failed to detect the libssl/openssl version to use, and may not work as expected. Defaulting to "openssl-1.1.x".
Please manually install OpenSSL and try installing Prisma again.
2025-12-18 12:14:03 [error]: Failed to connect to database {
  "error": {
    "name": "PrismaClientInitializationError",
    "clientVersion": "5.22.0"
  }
}
2025-12-18 12:14:03 [error]: Failed to start server {
  "error": {
    "name": "PrismaClientInitializationError",
    "clientVersion": "5.22.0"
  }
}
```

### Root Cause
Prisma Client requires OpenSSL libraries to connect to PostgreSQL databases. The Docker image didn't include OpenSSL packages, causing Prisma to fail when trying to initialize the database connection.

### Solution
Added OpenSSL packages to the Dockerfile:
```dockerfile
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    gcc \
    g++ \
    make \
    musl-dev \
    postgresql-client \
    openssl \          # Added for Prisma
    openssl-dev \      # Added for Prisma (build time)
    curl

# ... install pyswisseph ...

# Remove build tools but keep openssl for runtime
RUN apk del gcc g++ make musl-dev python3-dev openssl-dev
```

### How to Avoid
- **Always include OpenSSL** when using Prisma with PostgreSQL
- **Check Prisma requirements** for system dependencies
- **Test database connections** in the Docker container, not just the build
- **Keep runtime dependencies** (like `openssl`) even after removing build tools
- **Verify environment variables** (`DATABASE_URL`) are set correctly in DCDeploy

### Additional Notes
- The build succeeded, but the application failed at runtime
- This is a runtime dependency issue, not a build issue
- Ensure `DATABASE_URL` environment variable is set in DCDeploy

### Files Changed
- `backend/Dockerfile` (lines 42-52, 58)

---

## Issue #8: Prisma Client Generated Without OpenSSL Detection

**Date**: December 18, 2025  
**Build Version**: v10  
**Status**: ✅ Resolved

### Error Message
```
prisma:warn Prisma failed to detect the libssl/openssl version to use, and may not work as expected. Defaulting to "openssl-1.1.x".
Please manually install OpenSSL and try installing Prisma again.
2025-12-18 12:22:56 [error]: Failed to connect to database {
  "error": {
    "name": "PrismaClientInitializationError",
    "clientVersion": "5.22.0"
  }
}
```

### Root Cause
Prisma Client was generated in the builder stage (without OpenSSL), and then copied to the production stage. However, Prisma's binary needs to be compiled against the OpenSSL version that will be available at runtime. When Prisma is generated without OpenSSL present, it can't properly detect and link against OpenSSL, causing runtime connection failures.

### Solution
Regenerate Prisma Client in the production stage AFTER installing OpenSSL, so it can properly detect and link against the correct OpenSSL version:

```dockerfile
# Install OpenSSL and dependencies
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    # ... other packages ...

# Install npm packages
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy Prisma schema
COPY prisma ./prisma

# Regenerate Prisma Client in production stage with OpenSSL available
# This ensures Prisma binary is compiled against the correct OpenSSL version
RUN npx prisma generate

# Remove build tools (but keep openssl for runtime)
RUN apk del gcc g++ make musl-dev python3-dev openssl-dev
```

### How to Avoid
- **Generate Prisma Client in the production stage** after installing OpenSSL
- **Don't copy Prisma Client from builder stage** if OpenSSL wasn't available during generation
- **Keep openssl-dev during Prisma generation**, then remove it after
- **Test database connections** in the Docker container to catch runtime issues early
- **Verify Prisma generation warnings** - if OpenSSL detection fails, regenerate in production stage

### Key Insight
Prisma Client generation needs to happen in the environment where it will run, with the same system libraries available. Generating in one stage and copying to another can cause library linking issues.

### Files Changed
- `backend/Dockerfile` (lines 68-80)

---

### Potential Error
If not fixed, the application would fail at runtime when trying to write log files:
```
Error: ENOENT: no such file or directory, open 'logs/error-2025-12-18.log'
```

### Root Cause
The Winston logger is configured to write to `logs/` directory, but this directory doesn't exist in the Docker container by default.

### Solution
Created logs directory in Dockerfile before switching to non-root user:
```dockerfile
# Create logs directory and non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/logs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
```

### How to Avoid
- **Check application requirements** for directories that need to exist at runtime
- **Create required directories in Dockerfile** before the application starts
- **Set proper permissions** for directories that the application needs to write to
- Review application configuration (logger, file uploads, temp files, etc.) for directory requirements

### Files Changed
- `backend/Dockerfile` (lines 80-83)

---

## Issue #9: CORS Error - Frontend Blocked by Backend CORS Policy

**Date**: December 18, 2025  
**Build Version**: Post-deployment (Runtime)  
**Status**: ✅ Resolved

### Error Message
```
Access to XMLHttpRequest at 'https://backend-wqqk6wf4oz.dcdeploy.cloud/auth/register' 
from origin 'https://frontend-wqqk6wf4oz.dcdeploy.cloud' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:8080' 
that is not equal to the supplied origin.
```

### Root Cause
The backend CORS configuration was hardcoded to only allow requests from `http://localhost:8080` (the default `FRONTEND_URL`). When the frontend was deployed to `https://frontend-wqqk6wf4oz.dcdeploy.cloud`, the backend rejected all requests because the origin didn't match.

The CORS configuration only supported a single origin:
```typescript
export const corsConfig = cors({
  origin: config.frontendUrl, // Only one origin allowed
  // ...
});
```

### Solution
Updated CORS configuration to support multiple origins via `ALLOWED_ORIGINS` environment variable:

**1. Updated `backend/src/config/index.ts`**:
```typescript
// Frontend
frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
// Allowed origins for CORS (comma-separated, or use ALLOWED_ORIGINS env var)
allowedOrigins: process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [process.env.FRONTEND_URL || 'http://localhost:8080'],
```

**2. Updated `backend/src/middleware/security.ts`**:
```typescript
export const corsConfig = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, allow localhost variations
    if (config.nodeEnv === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Reject origin
    callback(new Error(`Not allowed by CORS: ${origin}. Allowed origins: ${config.allowedOrigins.join(', ')}`));
  },
  credentials: true,
  // ... rest of config
});
```

**3. Update DCDeploy Environment Variables**:
```env
FRONTEND_URL=https://frontend-wqqk6wf4oz.dcdeploy.cloud
ALLOWED_ORIGINS=https://frontend-wqqk6wf4oz.dcdeploy.cloud
```

Or for multiple origins (dev + production):
```env
ALLOWED_ORIGINS=https://frontend-wqqk6wf4oz.dcdeploy.cloud,http://localhost:8080
```

### How to Avoid
- **Always configure CORS for production URLs** before deploying frontend
- **Use `ALLOWED_ORIGINS` environment variable** for multiple origins support
- **Test CORS configuration** after deploying both frontend and backend
- **Document all required environment variables** including CORS-related ones
- **Set `FRONTEND_URL` and `ALLOWED_ORIGINS`** in DCDeploy before frontend deployment
- **Redeploy backend** after updating CORS environment variables

### Key Insight
CORS is a runtime configuration issue, not a build issue. The backend must be configured with the correct allowed origins before the frontend can make requests. Always update CORS settings when deploying to a new domain.

### Additional Notes
- This is a **runtime configuration issue**, not a build issue
- The backend build succeeded, but CORS blocked frontend requests
- Environment variables must be updated in DCDeploy and backend must be redeployed
- Consider supporting multiple origins from the start to avoid this issue

### Files Changed
- `backend/src/config/index.ts` (added `allowedOrigins` config)
- `backend/src/middleware/security.ts` (updated CORS origin function)

---

## Summary of Best Practices

### 1. Python Package Installation in Alpine Linux
- ✅ Always use `--break-system-packages` flag for Python 3.12+ in Alpine
- ✅ Install build tools before compiling Python packages
- ✅ Remove build tools after installation to reduce image size

### 2. Node.js Package Management
- ✅ Commit `package-lock.json` to version control
- ✅ Use conditional logic to handle missing lock files
- ✅ Prefer `npm ci` when lock file exists, fallback to `npm install`

### 3. Prisma in Docker
- ✅ Generate Prisma Client before TypeScript compilation (in builder stage)
- ✅ **Regenerate Prisma Client in production stage** after installing OpenSSL
- ✅ Copy Prisma schema files early in the build process
- ✅ Ensure Prisma Client is compiled against the correct OpenSSL version
- ✅ Keep openssl-dev during Prisma generation, remove after

### 4. Application Directories
- ✅ Create all required directories in Dockerfile
- ✅ Set proper ownership and permissions
- ✅ Check application configuration for directory requirements

### 5. Build Order in Dockerfiles
- ✅ Install system dependencies first
- ✅ Install application dependencies
- ✅ Generate code/artifacts (Prisma Client, etc.)
- ✅ Build application code
- ✅ Copy only necessary files to production stage

### 6. Testing Before Deployment
- ✅ Test Docker builds locally before pushing to GitHub
- ✅ Use `test-docker-build.sh` script for local testing
- ✅ Fix issues locally to avoid multiple deployment iterations

---

## Deployment Statistics

| Build Version | Status | Issue | Resolution Time |
|--------------|--------|-------|----------------|
| v1 | ❌ Failed | PEP 668 / Missing build tools | ~5 minutes |
| v2 | ❌ Failed | Missing build tools | ~3 minutes |
| v3 | ❌ Failed | Missing package-lock.json | ~3 minutes |
| v4 | ❌ Failed | Missing package-lock.json | ~2 minutes |
| v5 | ❌ Failed | Prisma Client order | ~3 minutes |
| v6 | ⏳ Pending | - | - |
| v7 | ❌ Failed | Stripe API version | ~3 minutes |
| v8 | ⏳ Pending | - | - |
| v9 | ❌ Failed | Prisma OpenSSL detection | ~5 minutes |
| v10 | ❌ Failed | Prisma Client OpenSSL linking | ~5 minutes |
| Post-deploy | ❌ Runtime | CORS error (frontend blocked) | ~5 minutes |

**Total Issues**: 9  
**Total Build Attempts**: 10  
**Runtime Issues**: 1  
**Average Resolution Time**: ~3 minutes per issue

---

## Prevention Checklist for Future Deployments

Before deploying a new application or making significant changes:

- [ ] **Python Packages**: Check if packages need compilation, add build tools if needed
- [ ] **Python 3.12+**: Add `--break-system-packages` flag for pip installs
- [ ] **Node.js**: Ensure `package-lock.json` is committed and handled gracefully
- [ ] **Prisma**: Generate Prisma Client before TypeScript build
- [ ] **Directories**: Create all required runtime directories (logs, temp, uploads, etc.)
- [ ] **Build Order**: Verify dependencies are available before they're used
- [ ] **Permissions**: Set proper ownership for directories/files the app needs to write
- [ ] **Multi-stage Builds**: Ensure artifacts are copied correctly between stages
- [ ] **Health Checks**: Configure health check endpoints correctly
- [ ] **Environment Variables**: Document all required environment variables
- [ ] **CORS Configuration**: Set `FRONTEND_URL` and `ALLOWED_ORIGINS` before frontend deployment
- [ ] **Local Testing**: Test Docker build locally before pushing to GitHub
- [ ] **Post-Deployment**: Test frontend-backend communication after both are deployed

---

## Related Files

- `backend/Dockerfile` - Main Dockerfile with all fixes applied
- `backend/.dockerignore` - Files excluded from Docker build context
- `backend/test-docker-build.sh` - Script for local Docker testing
- `docs/DCDEPLOY_BACKEND_DEPLOYMENT.md` - Complete deployment guide

---

## Notes

- All issues were resolved through iterative fixes
- Each fix was tested by pushing to GitHub and monitoring DCDeploy builds
- Future deployments should follow the prevention checklist to avoid similar issues
- Consider setting up CI/CD with local Docker testing before deployment

---

**Last Updated**: December 18, 2025  
**Maintained By**: Development Team

