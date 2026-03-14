import { useMemo } from "react";
import { Calendar, Clock, CheckCircle2, XCircle, AlertTriangle, DollarSign, TrendingUp, Wrench } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface ServicosKPIsProps {
  servicos: any[];
}

export function ServicosKPIs({ servicos }: ServicosKPIsProps) {
  const stats = useMemo(() => {
    const agendados = servicos.filter((s) => s.status === "agendado").length;
    const emAndamento = servicos.filter((s) => s.status === "em_andamento").length;
    const concluidos = servicos.filter((s) => s.status === "concluido").length;
    const cancelados = servicos.filter((s) => s.status === "cancelado").length;
    const total = servicos.length;

    const atrasados = servicos.filter((s) => {
      if (s.status === "concluido" || s.status === "cancelado" || !s.data_agendada) return false;
      return differenceInDays(parseISO(s.data_agendada), new Date()) < 0;
    }).length;

    const valorTotal = servicos
      .filter((s) => s.status !== "cancelado")
      .reduce((acc, s) => acc + (Number(s.valor) || 0), 0);

    const valorConcluido = servicos
      .filter((s) => s.status === "concluido")
      .reduce((acc, s) => acc + (Number(s.valor) || 0), 0);

    const taxaConclusao = total > 0 ? Math.round((concluidos / total) * 100) : 0;

    return { total, agendados, emAndamento, concluidos, cancelados, atrasados, valorTotal, valorConcluido, taxaConclusao };
  }, [servicos]);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const kpis = [
    { label: "Total", value: stats.total, icon: Wrench, color: "text-primary", bg: "bg-primary/10" },
    { label: "Agendados", value: stats.agendados, icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Em andamento", value: stats.emAndamento, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Concluídos", value: stats.concluidos, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Cancelados", value: stats.cancelados, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Atrasados", value: stats.atrasados, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", alert: stats.atrasados > 0 },
  ];

  return (
    <div className="space-y-3">
      {/* KPI cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={cn(
                "bg-card border border-border rounded-xl p-3 flex flex-col gap-1.5 transition-colors",
                kpi.alert && "border-orange-500/40 bg-orange-500/5"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">{kpi.label}</span>
                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", kpi.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", kpi.color)} />
                </div>
              </div>
              <p className={cn("text-xl font-bold", kpi.alert ? "text-orange-500" : "text-foreground")}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Financial summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Valor total</p>
            <p className="text-sm font-bold text-foreground">{fmt(stats.valorTotal)}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Valor concluído</p>
            <p className="text-sm font-bold text-emerald-600">{fmt(stats.valorConcluido)}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Taxa de conclusão</p>
            <p className="text-sm font-bold text-foreground">{stats.taxaConclusao}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
