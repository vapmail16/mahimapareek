import express from 'express';
import cookieParser from 'cookie-parser';
import { securityHeaders, corsConfig, apiLimiter, requestSizeLimit } from './middleware/security';
import requestId from './middleware/requestId';
import errorHandler from './middleware/errorHandler';
import routes from './routes';
import logger from './utils/logger';

// Create Express app
const app = express();

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// Apply security middleware
app.use(securityHeaders);
app.use(corsConfig);

// Body parsers
app.use(express.json({ limit: requestSizeLimit }));
app.use(express.urlencoded({ extended: true, limit: requestSizeLimit }));

// Cookie parser
app.use(cookieParser());

// Request ID middleware
app.use(requestId);

// Apply rate limiting to all routes
app.use('/api', apiLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    requestId: (req as any).id,
    ip: req.ip,
  });
  next();
});

// Mount API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    requestId: (req as any).id,
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;

