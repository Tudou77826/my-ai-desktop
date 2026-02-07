// ==================== Input Component ====================

import { forwardRef } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  showSearchIcon?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, showSearchIcon = false, ...props }, ref) => {
    return (
      <div className="relative">
        {showSearchIcon && (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            // Base styles
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2',
            'text-sm placeholder:text-gray-400',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Error state
            error && 'border-red-300 focus-visible:ring-red-500',
            // Search icon padding
            showSearchIcon && 'pl-10',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
