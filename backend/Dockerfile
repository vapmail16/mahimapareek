# Multi-stage build for Mahimapareek Backend
# Based on deployment issue log patterns and best practices

# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache openssl openssl-dev

# Copy package files (including package-lock.json if it exists)
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy Prisma schema first (needed for generating client)
COPY prisma ./prisma

# Generate Prisma Client BEFORE building TypeScript
# TypeScript needs Prisma types to compile
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /app

# Install runtime dependencies
# OpenSSL is required for Prisma Client to connect to PostgreSQL
RUN apk add --no-cache \
    openssl \
    postgresql-client \
    curl

# Copy package files
COPY package.json ./
COPY package-lock.json* ./

# Install production dependencies only
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy Prisma schema
COPY prisma ./prisma

# Regenerate Prisma Client in production stage with OpenSSL available
# This ensures Prisma binary is compiled against the correct OpenSSL version
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create logs directory and non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/logs /app/uploads

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/server.js"]

