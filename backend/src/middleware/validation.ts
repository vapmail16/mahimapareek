import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

/**
 * Validation middleware wrapper
 * Runs validation chains and returns errors if any
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: errors.array(),
        requestId: (req as any).id,
      });
      return;
    }

    next();
  };
};

/**
 * Common validation rules
 */
export const validators = {
  // Email validation
  email: body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .trim(),

  // Password validation (strong)
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&#]/)
    .withMessage('Password must contain at least one special character (@$!%*?&#)'),

  // Name validation
  name: body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),

  // UUID validation
  uuid: (field: string) =>
    body(field)
      .isUUID()
      .withMessage(`${field} must be a valid UUID`),
};

export default validate;

