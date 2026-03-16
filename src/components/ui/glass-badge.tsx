import * as React from 'react';
import { cn } from '@/lib/utils';

interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neon' | 'success' | 'warning' | 'destructive' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const GlassBadge = React.forwardRef<HTMLSpanElement, GlassBadgeProps>(
  ({ className, variant = 'neon', size = 'md', ...props }, ref) => {
    const variantClasses = {
      neon: 'glass-badge-neon',
      success: 'bg-green-400/15 border border-green-400/40 text-green-400',
      warning: 'bg-amber-400/15 border border-amber-400/40 text-amber-400',
      destructive: 'bg-red-400/15 border border-red-400/40 text-red-400',
      info: 'bg-blue-400/15 border border-blue-400/40 text-blue-400',
    };

    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
      lg: 'px-4 py-2 text-base',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-block rounded-full font-semibold transition-all duration-200',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

GlassBadge.displayName = 'GlassBadge';

export { GlassBadge };
