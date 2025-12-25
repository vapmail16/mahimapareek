import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID middleware
 * Generates or extracts request ID from headers and adds it to request and response
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  // Get request ID from header or generate new one
  const reqId = (req.headers['x-request-id'] as string) || uuidv4();
  
  // Add to request object
  (req as any).id = reqId;
  
  // Add to response headers
  res.setHeader('X-Request-ID', reqId);
  
  next();
};

export default requestId;

