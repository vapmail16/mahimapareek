# Frontend Deployment Guide

## Environment Variables

Vite uses **build-time** environment variables (not runtime). Variables must be prefixed with `VITE_` and are injected during the build process.

### Local Development

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your local backend URL:
```env
VITE_API_URL=http://localhost:3000
```

### Docker Build

Vite environment variables must be passed as **build arguments** to Docker:

```bash
docker build \
  --build-arg VITE_API_URL=https://your-backend-domain.com \
  -t mahimapareek-frontend \
  .
```

### DCDeploy Configuration

In DCDeploy, set `VITE_API_URL` as a **build argument** (not runtime environment variable):

**Build Arguments**:
```
VITE_API_URL=https://your-backend-domain.com
```

**Important**: 
- These are build-time variables, not runtime
- They must be set during the Docker build process
- They cannot be changed after the image is built

## Docker Build Process

1. **Builder Stage**:
   - Installs dependencies
   - Sets `VITE_API_URL` from build argument
   - Builds the application (Vite injects the variable)

2. **Production Stage**:
   - Uses nginx to serve static files
   - No environment variables needed at runtime
   - All variables are baked into the build

## Testing Locally

```bash
# Build with custom API URL
docker build --build-arg VITE_API_URL=http://localhost:3000 -t frontend-test .

# Run container
docker run -p 8080:80 frontend-test

# Test in browser
open http://localhost:8080
```

## Troubleshooting

**Issue**: API calls fail with wrong URL
- **Cause**: `VITE_API_URL` not set correctly during build
- **Fix**: Rebuild with correct `--build-arg VITE_API_URL=...`

**Issue**: Environment variable not working
- **Cause**: Variable not prefixed with `VITE_`
- **Fix**: Only variables starting with `VITE_` are exposed to the client

**Issue**: Need to change API URL after deployment
- **Cause**: Vite variables are build-time only
- **Fix**: Rebuild and redeploy with new `VITE_API_URL`

