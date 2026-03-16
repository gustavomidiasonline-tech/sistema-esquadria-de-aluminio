import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassProgress } from '@/components/ui/glass-progress';
import { GlassButton } from '@/components/ui/glass-button';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlassDashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: {
    label: string;
    variant?: 'neon' | 'success' | 'warning' | 'destructive' | 'info';
  };
  progress?: {
    value: number;
    label?: string;
    color?: 'green' | 'yellow' | 'blue' | 'red' | 'purple';
  };
  trend?: {
    direction: 'up' | 'down';
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  footer?: {
    text: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  neonAccent?: boolean;
  glowEffect?: boolean;
}

export const GlassDashboardCard: React.FC<GlassDashboardCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  progress,
  trend,
  icon,
  footer,
  neonAccent = false,
  glowEffect = false,
}) => {
  return (
    <GlassCard variant='stat' neonAccent={neonAccent} glowEffect={glowEffect}>
      <div className='space-y-4'>
        {/* Header */}
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <h3 className='text-sm font-medium text-gray-400'>{title}</h3>
            {subtitle && (
              <p className='text-xs text-gray-500 mt-1'>{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className='text-gray-500'>
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className='flex items-baseline gap-2'>
          <span className='text-3xl font-bold text-white'>
            {value}
          </span>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold',
              trend.direction === 'up'
                ? 'text-green-400 bg-green-400/10'
                : 'text-red-400 bg-red-400/10'
            )}>
              {trend.direction === 'up' ? (
                <TrendingUp className='h-3 w-3' />
              ) : (
                <TrendingDown className='h-3 w-3' />
              )}
              {trend.value}% {trend.label}
            </div>
          )}
        </div>

        {/* Badge */}
        {badge && (
          <GlassBadge variant={badge.variant || 'neon'} size='sm'>
            {badge.label}
          </GlassBadge>
        )}

        {/* Progress Bar */}
        {progress && (
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span className='text-xs text-gray-400'>
                {progress.label || 'Progress'}
              </span>
              <span className='text-xs text-gray-500'>
                {progress.value}%
              </span>
            </div>
            <GlassProgress
              value={progress.value}
              color={progress.color || 'green'}
            />
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className='border-t border-white/10 pt-3 flex items-center justify-between'>
            <p className='text-xs text-gray-400'>{footer.text}</p>
            {footer.action && (
              <GlassButton
                variant='secondary'
                size='sm'
                onClick={footer.action.onClick}
              >
                {footer.action.label}
              </GlassButton>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default GlassDashboardCard;
