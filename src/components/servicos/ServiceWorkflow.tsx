import { useState, useEffect, useCallback } from "react";
import { Check, Ruler, ShoppingCart, PackageCheck, Wrench, ClipboardCheck, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const ETAPAS = [
  { key: "conferir_medidas", label: "Conferir medidas", icon: Ruler, description: "Verificar todas as medidas no local" },
  { key: "solicitar_materiais", label: "Solicitar materiais", icon: ShoppingCart, description: "Solicitar materiais necessários" },
  { key: "recebimento", label: "Recebimento", icon: PackageCheck, description: "Receber e conferir materiais" },
  { key: "instalacao", label: "Instalação", icon: Wrench, description: "Executar a instalação" },
  { key: "conferencia_obra", label: "Conferência da obra", icon: ClipboardCheck, description: "Inspeção final da obra" },
];

interface ChecklistItem {
  id: string;
  etapa: string;
  concluida: boolean;
  concluida_em: string | null;
  observacoes: string | null;
}

interface ServiceWorkflowProps {
  servicoId: string;
  servicoStatus: string;
}

export function ServiceWorkflow({ servicoId, servicoStatus }: ServiceWorkflowProps) {
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [obsDialog, setObsDialog] = useState<string | null>(null);
  const [obsText, setObsText] = useState("");

  const loadChecklist = useCallback(async () => {
    const { data } = await supabase
      .from("servico_checklist")
      .select("*")
      .eq("servico_id", servicoId);
    setChecklist(data || []);
  }, [servicoId]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  const getEtapaStatus = (etapaKey: string) => {
    return checklist.find((c) => c.etapa === etapaKey);
  };

  const toggleEtapa = async (etapaKey: string) => {
    if (loading) return;
    setLoading(true);

    const existing = getEtapaStatus(etapaKey);

    try {
      if (existing) {
        if (existing.concluida) {
          // Uncheck
          await supabase
            .from("servico_checklist")
            .update({ concluida: false, concluida_em: null, concluida_por: null, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          // Check
          await supabase
            .from("servico_checklist")
            .update({ concluida: true, concluida_em: new Date().toISOString(), concluida_por: user?.id, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
        }
      } else {
        // Create checked
        await supabase.from("servico_checklist").insert({
          servico_id: servicoId,
          etapa: etapaKey,
          concluida: true,
          concluida_em: new Date().toISOString(),
          concluida_por: user?.id,
        });
      }
      await loadChecklist();
    } catch {
      toast.error("Erro ao atualizar etapa");
    } finally {
      setLoading(false);
    }
  };

  const saveObs = async (etapaKey: string) => {
    const existing = getEtapaStatus(etapaKey);
    try {
      if (existing) {
        await supabase
          .from("servico_checklist")
          .update({ observacoes: obsText, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("servico_checklist").insert({
          servico_id: servicoId,
          etapa: etapaKey,
          observacoes: obsText,
        });
      }
      await loadChecklist();
      setObsDialog(null);
      setObsText("");
      toast.success("Observação salva");
    } catch {
      toast.error("Erro ao salvar observação");
    }
  };

  const completed = ETAPAS.filter((e) => getEtapaStatus(e.key)?.concluida).length;
  const progress = (completed / ETAPAS.length) * 100;

  // Find current active step (first uncompleted)
  const currentStepIndex = ETAPAS.findIndex((e) => !getEtapaStatus(e.key)?.concluida);

  return (
    <div className="border-t border-border">
      {/* Progress bar header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-foreground">
              Workflow {completed}/{ETAPAS.length}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progress === 100 ? "bg-emerald-500" : "bg-primary"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded checklist */}
      {expanded && (
        <div className="px-4 pb-3 space-y-0">
          {ETAPAS.map((etapa, index) => {
            const status = getEtapaStatus(etapa.key);
            const isCompleted = status?.concluida;
            const isCurrent = index === currentStepIndex;
            const Icon = etapa.icon;

            return (
              <div key={etapa.key} className="flex items-start gap-3 relative">
                {/* Vertical line */}
                {index < ETAPAS.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-[13px] top-[28px] w-0.5 h-[calc(100%-4px)]",
                      isCompleted ? "bg-emerald-500/50" : "bg-border"
                    )}
                  />
                )}

                {/* Step indicator */}
                <button
                  onClick={() => toggleEtapa(etapa.key)}
                  disabled={loading}
                  className={cn(
                    "relative z-10 mt-1.5 h-[26px] w-[26px] rounded-full flex items-center justify-center shrink-0 transition-all border-2",
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isCurrent
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-[10px] font-bold">{index + 1}</span>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 py-1.5 min-h-[40px]">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-3.5 w-3.5", isCompleted ? "text-emerald-500" : isCurrent ? "text-primary" : "text-muted-foreground")} />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isCompleted ? "text-emerald-600 line-through" : isCurrent ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {etapa.label}
                    </span>
                    <button
                      onClick={() => {
                        setObsDialog(etapa.key);
                        setObsText(status?.observacoes || "");
                      }}
                      className="ml-auto text-muted-foreground hover:text-primary transition-colors"
                      title="Observação"
                    >
                      <MessageSquare className={cn("h-3 w-3", status?.observacoes ? "text-primary" : "")} />
                    </button>
                  </div>
                  {isCompleted && status?.concluida_em && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">
                      Concluída em {format(new Date(status.concluida_em), "dd/MM/yyyy HH:mm")}
                    </p>
                  )}
                  {status?.observacoes && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 ml-5 italic">
                      {status.observacoes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Obs dialog inline */}
          {obsDialog && (
            <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border space-y-2">
              <p className="text-xs font-medium text-foreground">
                Observação — {ETAPAS.find((e) => e.key === obsDialog)?.label}
              </p>
              <textarea
                value={obsText}
                onChange={(e) => setObsText(e.target.value)}
                className="w-full text-xs bg-background border border-border rounded-md p-2 resize-none h-16 outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                placeholder="Adicione uma observação..."
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setObsDialog(null); setObsText(""); }}
                  className="text-[11px] px-3 py-1 rounded border border-border text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => saveObs(obsDialog)}
                  className="text-[11px] px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
