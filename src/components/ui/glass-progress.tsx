import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface GlassProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  color?: 'green' | 'yellow' | 'blue' | 'red' | 'purple';
  animated?: boolean;
}

const GlassProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  GlassProgressProps
>(({ className, value, color = 'green', animated = true, ...props }, ref) => {
  const colorClasses = {
    green: 'bg-gradient-to-r from-green-400 to-emerald-400',
    yellow: 'bg-gradient-to-r from-yellow-400 to-amber-400',
    blue: 'bg-gradient-to-r from-blue-400 to-cyan-400',
    red: 'bg-gradient-to-r from-red-400 to-pink-400',
    purple: 'bg-gradient-to-r from-purple-400 to-pink-400',
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'glass-progress-bar',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full rounded-full transition-all',
          colorClasses[color],
          animated && 'shadow-[0_0_16px_rgba(0,255,136,0.3)]'
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});

GlassProgress.displayName = ProgressPrimitive.Root.displayName;

export { GlassProgress };
