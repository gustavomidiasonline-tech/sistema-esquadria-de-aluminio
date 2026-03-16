import * as React from 'react';
import { cn } from '@/lib/utils';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      ...props
    },
    ref
  ) => {
    const baseClasses = {
      primary: 'glass-button-primary',
      secondary: 'glass-button-secondary',
      ghost: 'relative px-6 py-2.5 rounded-lg font-medium transition-all text-gray-200 hover:text-white hover:bg-white/10',
    };

    const sizeClasses = {
      sm: 'text-sm px-3 py-1.5',
      md: 'text-base px-6 py-2.5',
      lg: 'text-lg px-8 py-3.5',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'relative font-medium transition-all duration-200 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed',
          baseClasses[variant],
          variant === 'primary' || variant === 'secondary' ? '' : sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

GlassButton.displayName = 'GlassButton';

export { GlassButton };
