import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import config from '../config';

/**
 * Global error handler middleware
 * Catches all errors and sends appropriate response
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = (req as any).id;
  const userId = (req as any).user?.id;

  // Determine status code
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Log error with context
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    requestId,
    userId,
    method: req.method,
    path: req.path,
    statusCode,
    isOperational,
  });

  // Send error response
  const errorResponse: any = {
    success: false,
    error: message,
    requestId,
  };

  // Include stack trace in development
  if (config.nodeEnv === 'development' && err.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;

