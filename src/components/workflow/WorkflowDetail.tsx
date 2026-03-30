import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
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
  const [nextIncompleteIndex, setNextIncompleteIndex] = useState(0);

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

  // Calcular próxima etapa incompleta para auto-avanço
  useEffect(() => {
    const stagesLength = stages.length;
    if (stagesLength === 0) return;

    for (let i = 0; i < stagesLength; i++) {
      const stage = stages[i];
      const progress = progressItems.find((p) => p.stage_id === stage.id);
      if (!progress || progress.status !== "concluido") {
        setNextIncompleteIndex(i);
        return;
      }
    }
    // Todas as etapas concluídas
    setNextIncompleteIndex(stagesLength);
  }, [stages, progressItems]);

  const completedCount = progressItems.filter(
    (p) => p.status === "concluido"
  ).length;
  const totalSteps = stages.length;
  const progressPct =
    totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const isAllComplete = progressPct === 100 && totalSteps > 0;

  const getProgressForStage = (stageId: string) => {
    const p = progressItems.find((pi) => pi.stage_id === stageId);
    if (!p) return null;
    return {
      id: p.id,
      status: p.status,
      data:
        (typeof p.data === "object" && p.data !== null
          ? p.data
          : {}) as Record<string, unknown>,
      completed_at: p.completed_at,
    };
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">
            Pedido #{pedido.numero}
          </h2>
          <p className="text-sm text-muted-foreground">
            {pedido.cliente?.nome || "Sem cliente"} •{" "}
            {pedido.vendedor || "Sem vendedor"}
          </p>
        </div>
      </div>

      {/* Progress card */}
      <div className={cn(
        "glass-card-premium p-6 rounded-lg border transition-all duration-700",
        isAllComplete
          ? "border-emerald-500/50 bg-emerald-500/5"
          : "border-border hover:border-primary/30"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              📊 Progresso do Pedido
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {completedCount} de {totalSteps} etapas concluídas
            </p>
          </div>
          <div
            className={cn(
              "text-3xl font-bold transition-all duration-500",
              isAllComplete
                ? "text-emerald-600 dark:text-emerald-400 scale-110"
                : "text-primary"
            )}
          >
            {progressPct}%
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-4 shadow-inner">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1200 ease-out shadow-lg",
              isAllComplete
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                : "bg-gradient-to-r from-blue-500 via-primary to-primary/70"
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Mini step indicators */}
        <div className="flex items-center gap-1.5">
          {stages.map((stage, idx) => {
            const prog = getProgressForStage(stage.id);
            const done = prog?.status === "concluido";
            const isActive = idx === nextIncompleteIndex;
            return (
              <div
                key={stage.id}
                className={cn(
                  "flex-1 h-2 rounded-full transition-all duration-600",
                  done
                    ? "bg-emerald-500 shadow-md"
                    : isActive
                      ? "bg-blue-500/70 animate-pulse"
                      : "bg-muted-foreground/20"
                )}
                title={stage.name}
              />
            );
          })}
        </div>

        {/* Completion message */}
        {isAllComplete && (
          <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border border-emerald-500/40 flex items-center gap-3 animate-in fade-in scale-in duration-500">
            <span className="text-2xl animate-bounce">🎉</span>
            <div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                Parabéns! Pedido 100% concluído!
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                Todas as etapas foram completadas com sucesso ✨
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Steps list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 bg-gradient-to-r from-muted/50 via-muted/70 to-muted/50 rounded-lg animate-pulse"
              style={{
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      ) : stages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhuma etapa configurada para este pedido
          </p>
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
              isNextStage={idx === nextIncompleteIndex}
              onStageComplete={() => {
                // Auto-scroll para próxima etapa após animação
                setTimeout(() => {
                  const nextElement = document.querySelector(
                    `[data-step-index="${idx + 1}"]`
                  );
                  nextElement?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }, 800);
              }}
            />
          ))}
        </div>
      )}

      {/* Footer action */}
      {isAllComplete && (
        <div className="flex justify-end pt-4">
          <Button onClick={onBack} className="gap-2">
            ← Voltar para pedidos
          </Button>
        </div>
      )}
    </div>
  );
}
