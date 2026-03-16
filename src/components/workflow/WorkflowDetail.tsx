import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StepItem } from "./StepItem";
import { cn } from "@/lib/utils";

interface WorkflowStage {
  id: string;
  name: string;
  icon: string;
  field_type: string;
  sort_order: number;
}

interface ProgressItem {
  id: string;
  stage_id: string;
  status: string;
  data: Record<string, unknown>;
  completed_at: string | null;
}

interface PedidoInfo {
  id: string;
  numero: number;
  status: string;
  valor_total: number | null;
  cliente?: { nome: string } | null;
  vendedor?: string | null;
  data_entrega?: string | null;
}

interface WorkflowDetailProps {
  pedido: PedidoInfo;
  onBack: () => void;
}

export function WorkflowDetail({ pedido, onBack }: WorkflowDetailProps) {
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [stagesRes, progressRes] = await Promise.all([
      supabase.from("workflow_templates").select("*").order("sort_order"),
      supabase.from("order_progress").select("*").eq("pedido_id", pedido.id),
    ]);
    setStages((stagesRes.data as WorkflowStage[]) || []);
    setProgressItems((progressRes.data as ProgressItem[]) || []);
    setLoading(false);
  }, [pedido.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completedCount = progressItems.filter(p => p.status === "concluido").length;
  const totalSteps = stages.length;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const getProgressForStage = (stageId: string) => {
    const p = progressItems.find(pi => pi.stage_id === stageId);
    if (!p) return null;
    return {
      id: p.id,
      status: p.status,
      data: (typeof p.data === "object" && p.data !== null ? p.data : {}) as Record<string, unknown>,
      completed_at: p.completed_at,
    };
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">
            Pedido #{pedido.numero}
          </h2>
          <p className="text-sm text-muted-foreground">
            {pedido.cliente?.nome || "Sem cliente"} • {pedido.vendedor || "Sem vendedor"}
          </p>
        </div>
      </div>

      {/* Progress summary */}
      <div className="glass-card-premium p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-foreground">Progresso do Pedido</span>
          <span className={cn(
            "text-lg font-bold",
            progressPct === 100 ? "text-emerald-600" : "text-primary"
          )}>
            {progressPct}%
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              progressPct === 100 ? "bg-emerald-500" : "bg-primary"
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {completedCount} de {totalSteps} etapas concluídas
        </p>

        {/* Mini step indicators */}
        <div className="flex items-center gap-2 mt-4">
          {stages.map((stage) => {
            const prog = getProgressForStage(stage.id);
            const done = prog?.status === "concluido";
            return (
              <div
                key={stage.id}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-all",
                  done ? "bg-emerald-500" : "bg-muted-foreground/20"
                )}
                title={stage.name}
              />
            );
          })}
        </div>
      </div>

      {/* Steps accordion */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {stages.map((stage, idx) => (
            <StepItem
              key={stage.id}
              stage={stage}
              progress={getProgressForStage(stage.id)}
              pedidoId={pedido.id}
              index={idx}
              totalSteps={totalSteps}
              onUpdate={loadData}
            />
          ))}
        </div>
      )}
    </div>
  );
}
