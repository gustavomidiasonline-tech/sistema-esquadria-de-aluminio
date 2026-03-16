import * as React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'premium' | 'panel' | 'stat' | 'input';
  neonAccent?: boolean;
  glowEffect?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = 'premium',
      neonAccent = false,
      glowEffect = false,
      ...props
    },
    ref
  ) => {
    const baseClasses = {
      premium: 'glass-card-premium',
      panel: 'glass-panel',
      stat: 'glass-stat-card',
      input: 'glass-input-field',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses[variant],
          neonAccent && 'border-glass-neon-green shadow-[0_0_16px_rgba(0,255,136,0.2)]',
          glowEffect && 'glass-glow-accent',
          className
        )}
        {...props}
      />
    );
  }
);

GlassCard.displayName = 'GlassCard';

export { GlassCard };
