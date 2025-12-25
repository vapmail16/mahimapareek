/**
 * Password Strength Indicator Component
 * 
 * Displays real-time password strength feedback
 */

import { useMemo } from 'react';
import { checkPasswordStrength, PasswordStrength } from '../utils/passwordStrength';
import { cn } from '../lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator = ({
  password,
  className,
}: PasswordStrengthIndicatorProps) => {
  const strengthResult = useMemo(() => {
    if (!password) {
      return null;
    }
    return checkPasswordStrength(password);
  }, [password]);

  if (!password || !strengthResult) {
    return null;
  }

  const { strength, feedback } = strengthResult;

  const strengthConfig = {
    [PasswordStrength.WEAK]: {
      label: 'Weak',
      color: 'text-destructive',
      bgColor: 'bg-destructive',
      progress: 25,
    },
    [PasswordStrength.FAIR]: {
      label: 'Fair',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500',
      progress: 50,
    },
    [PasswordStrength.GOOD]: {
      label: 'Good',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      progress: 75,
    },
    [PasswordStrength.STRONG]: {
      label: 'Strong',
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      progress: 100,
    },
  };

  const config = strengthConfig[strength];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password strength:</span>
        <span className={cn('font-medium', config.color)}>{config.label}</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', config.bgColor)}
          style={{ width: `${config.progress}%` }}
          role="progressbar"
          aria-valuenow={config.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${config.label}`}
        />
      </div>

      {/* Feedback messages */}
      {feedback.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {feedback.map((message, index) => (
            <li key={index}>• {message}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

