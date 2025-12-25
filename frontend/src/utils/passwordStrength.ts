/**
 * Password Strength Validation Utility (Frontend)
 * 
 * Client-side password strength checking
 * Matches backend implementation for consistency
 */

export enum PasswordStrength {
  WEAK = 'WEAK',
  FAIR = 'FAIR',
  GOOD = 'GOOD',
  STRONG = 'STRONG',
}

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;
  feedback: string[];
}

// Common passwords list (matches backend)
const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'password1',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty',
  'abc123',
  'monkey',
  '1234567',
  'letmein',
  'trustno1',
  'dragon',
  'baseball',
  'iloveyou',
  'master',
  'sunshine',
  'ashley',
  'bailey',
  'passw0rd',
  'shadow',
  '123123',
  '654321',
  'superman',
  'qazwsx',
  'michael',
  'football',
  'welcome',
  'jesus',
  'ninja',
  'mustang',
  'password1',
  'admin',
  'administrator',
  'root',
  'toor',
  'test',
  'guest',
  'user',
  'demo',
  'sample',
  'changeme',
  'default',
  'temp',
  'temporary',
  'pass',
  'secret',
  'private',
  'public',
  'access',
  'login',
  'welcome123',
  'password123',
  'admin123',
  'root123',
  'test123',
  'guest123',
  'user123',
  'demo123',
  'changeme123',
  'default123',
  'temp123',
  'pass123',
  'secret123',
  'private123',
  'public123',
  'access123',
  'login123',
  'welcome1',
  'password1',
  'admin1',
  'root1',
  'test1',
  'guest1',
  'user1',
  'demo1',
  'changeme1',
  'default1',
  'temp1',
  'pass1',
  'secret1',
  'private1',
  'public1',
  'access1',
  'login1',
  'Password',
  'Password123',
  'Password1',
  'Admin',
  'Admin123',
  'Root',
  'Test',
  'Guest',
  'User',
  'Welcome',
  'Welcome123',
  'Welcome1',
]);

/**
 * Check if password is in common passwords list
 */
export const isCommonPassword = (password: string): boolean => {
  if (!password) {
    return false;
  }
  return COMMON_PASSWORDS.has(password.toLowerCase());
};

/**
 * Calculate password strength score
 * Matches backend implementation
 */
const calculateScore = (password: string): { score: number; feedback: string[] } => {
  let score = 0;
  const feedback: string[] = [];

  if (!password) {
    return { score: 0, feedback: ['Password is required'] };
  }

  // Character type checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[@$!%*?&#_\-+=\[\]{}|\\:;"'<>,./]/.test(password);

  const hasAllTypes = hasLowercase && hasUppercase && hasNumbers && hasSpecial;

  // Missing character type feedback
  if (!hasLowercase) {
    feedback.push('Add lowercase letters');
  }
  if (!hasUppercase) {
    feedback.push('Add uppercase letters');
  }
  if (!hasNumbers) {
    feedback.push('Add numbers');
  }
  if (!hasSpecial) {
    feedback.push('Add special characters');
  }

  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
    score = 0; // Always WEAK if shorter than 8 chars
  } else if (!hasAllTypes) {
    // Has length but missing character types = WEAK
    score = 0;
  } else {
    // Has all types, score based on length
    if (password.length >= 13) {
      score = 4; // STRONG
    } else if (password.length >= 10) {
      score = 3; // GOOD
    } else {
      score = 2; // FAIR (8-9 chars with all types)
    }
  }

  // Penalty for common passwords
  if (isCommonPassword(password)) {
    score = Math.max(0, score - 2);
    feedback.push('This password is too common');
  }

  return { score, feedback };
};

/**
 * Determine strength level from score
 */
const getStrengthFromScore = (score: number): PasswordStrength => {
  if (score <= 1) {
    return PasswordStrength.WEAK;
  } else if (score === 2) {
    return PasswordStrength.FAIR;
  } else if (score === 3) {
    return PasswordStrength.GOOD;
  } else {
    return PasswordStrength.STRONG;
  }
};

/**
 * Check password strength
 */
export const checkPasswordStrength = (password: string): PasswordStrengthResult => {
  const { score, feedback } = calculateScore(password);
  const strength = getStrengthFromScore(score);

  return {
    strength,
    score,
    feedback: feedback.length > 0 ? feedback : [],
  };
};

/**
 * Check if password should be rejected (WEAK or FAIR)
 */
export const shouldRejectPassword = (password: string): boolean => {
  const result = checkPasswordStrength(password);
  return result.strength === PasswordStrength.WEAK || result.strength === PasswordStrength.FAIR;
};

