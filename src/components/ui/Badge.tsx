// ==================== Badge Component ====================

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'neutral' | 'default' | 'outline';
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'neutral', children, ...props }, ref) => {
    const variantStyles = {
      success: 'bg-green-100 text-green-700',
      warning: 'bg-yellow-100 text-yellow-700',
      error: 'bg-red-100 text-red-700',
      neutral: 'bg-gray-100 text-gray-700',
      default: 'bg-amber-600 text-white',
      outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';
