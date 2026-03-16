import { useMemo } from 'react';
import { FileText, Clock, TrendingUp, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Orcamento {
  status: string;
  valor_total: number | string | null;
}

interface OrcamentoStatsProps {
  orcamentos: Orcamento[];
}

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export function OrcamentoStats({ orcamentos }: OrcamentoStatsProps) {
  const stats = useMemo(() => {
    const total = orcamentos.length;
    const aprovados = orcamentos.filter((o) => o.status === 'aprovado').length;
    const enviados = orcamentos.filter((o) => o.status === 'enviado').length;
    const rascunhos = orcamentos.filter((o) => o.status === 'rascunho').length;
    const rejeitados = orcamentos.filter((o) => o.status === 'rejeitado').length;
    const valorTotal = orcamentos.reduce((s, o) => s + (Number(o.valor_total) || 0), 0);
    const valorAprovado = orcamentos
      .filter((o) => o.status === 'aprovado')
      .reduce((s, o) => s + (Number(o.valor_total) || 0), 0);
    const taxaAprovacao = total > 0 ? Math.round((aprovados / total) * 100) : 0;
    return { total, aprovados, enviados, rascunhos, rejeitados, valorTotal, valorAprovado, taxaAprovacao };
  }, [orcamentos]);

  const kpis = [
    { label: 'Total', value: stats.total, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Rascunhos', value: stats.rascunhos, icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
    { label: 'Enviados', value: stats.enviados, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Aprovados', value: stats.aprovados, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Rejeitados', value: stats.rejeitados, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Taxa aprov.', value: `${stats.taxaAprovacao}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Valor total', value: fmt(stats.valorTotal), icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', small: true },
    { label: 'Valor aprov.', value: fmt(stats.valorAprovado), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10', small: true },
  ] as const;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.label} className="glass-card-premium p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-muted-foreground">{kpi.label}</span>
              <div className={cn('h-6 w-6 rounded-md flex items-center justify-center', kpi.bg)}>
                <Icon className={cn('h-3 w-3', kpi.color)} />
              </div>
            </div>
            <p className={cn('font-bold text-foreground', 'small' in kpi && kpi.small ? 'text-xs' : 'text-lg')}>
              {String(kpi.value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
