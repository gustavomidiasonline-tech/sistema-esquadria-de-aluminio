import { cn } from '@/lib/utils';
import { STATUS_COLOR, STATUS_LABEL } from './orcamento-status-constants';

interface OrcamentoStatusBadgeProps {
  status: string;
  className?: string;
}

export function OrcamentoStatusBadge({ status, className }: OrcamentoStatusBadgeProps) {
  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-full text-[10px] font-semibold border',
        STATUS_COLOR[status] ?? STATUS_COLOR.rascunho,
        className
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
