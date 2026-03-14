import { useState, useEffect } from "react";
import { Ruler, ShoppingCart, PackageCheck, Wrench, ClipboardCheck, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, any> = {
  ruler: Ruler,
  "shopping-cart": ShoppingCart,
  "package-check": PackageCheck,
  wrench: Wrench,
  "clipboard-check": ClipboardCheck,
};

interface WorkflowCardProps {
  pedido: {
    id: string;
    numero: number;
    status: string;
    valor_total: number | null;
    vendedor: string | null;
    data_entrega: string | null;
    created_at: string;
    cliente: { nome: string } | null;
  };
  stages: { id: string; name: string; icon: string; sort_order: number }[];
  onClick: () => void;
}

export function WorkflowCard({ pedido, stages, onClick }: WorkflowCardProps) {
  const [progress, setProgress] = useState<{ stage_id: string; status: string }[]>([]);

  useEffect(() => {
    supabase
      .from("order_progress")
      .select("stage_id, status")
      .eq("pedido_id", pedido.id)
      .then(({ data }) => setProgress(data || []));
  }, [pedido.id]);

  const completedCount = progress.filter(p => p.status === "concluido").length;
  const totalSteps = stages.length;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const statusLabels: Record<string, string> = {
    pendente: "Pendente",
    em_producao: "Em Produção",
    pronto: "Pronto",
    entregue: "Entregue",
    cancelado: "Cancelado",
  };

  const statusColors: Record<string, string> = {
    pendente: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    em_producao: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    pronto: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    entregue: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    cancelado: "bg-red-500/15 text-red-700 dark:text-red-400",
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-xl p-5 text-left hover:shadow-lg hover:border-primary/30 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
            Pedido #{pedido.numero}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {(pedido.cliente as any)?.nome || "Sem cliente"}
          </p>
        </div>
        <span className={cn(
          "text-[10px] font-semibold px-2.5 py-1 rounded-full",
          statusColors[pedido.status] || "bg-muted text-muted-foreground"
        )}>
          {statusLabels[pedido.status] || pedido.status}
        </span>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-4">
        {pedido.vendedor && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" /> {pedido.vendedor}
          </span>
        )}
        {pedido.data_entrega && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {new Date(pedido.data_entrega).toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-muted-foreground">Progresso</span>
          <span className={cn(
            "text-xs font-bold",
            progressPct === 100 ? "text-emerald-600" : "text-primary"
          )}>
            {progressPct}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              progressPct === 100 ? "bg-emerald-500" : "bg-primary"
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step icons */}
      <div className="flex items-center gap-1.5">
        {stages.map((stage) => {
          const prog = progress.find(p => p.stage_id === stage.id);
          const done = prog?.status === "concluido";
          const IconComp = ICON_MAP[stage.icon] || ClipboardCheck;

          return (
            <div
              key={stage.id}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                done
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-muted text-muted-foreground"
              )}
              title={stage.name}
            >
              <IconComp className="h-3.5 w-3.5" />
            </div>
          );
        })}
      </div>
    </button>
  );
}
