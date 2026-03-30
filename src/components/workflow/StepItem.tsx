import { useState, useEffect, useCallback } from "react";
import { Check, Save, ChevronDown, SkipForward, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useAutoMateriais } from "@/hooks/useAutoMateriais";

interface StepItemProps {
  stage: {
    id: string;
    name: string;
    icon: string;
    field_type: string;
    sort_order: number;
  };
  progress: {
    id?: string;
    status: string;
    data: Record<string, unknown>;
    completed_at?: string | null;
  } | null;
  pedidoId: string;
  index: number;
  totalSteps: number;
  onUpdate: () => void;
  onStageComplete?: () => void;
  isNextStage?: boolean;
  previousStageData?: Record<string, unknown>; // Dados da etapa anterior (para auto-detect)
}

export function StepItem({
  stage,
  progress,
  pedidoId,
  index,
  totalSteps,
  onUpdate,
  onStageComplete,
  isNextStage,
  previousStageData,
}: StepItemProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(isNextStage ?? false);
  const [localData, setLocalData] = useState<Record<string, unknown>>(progress?.data || {});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const isCompleted = progress?.status === "concluido";

  // Auto-detect materiais quando etapa de checklist_materiais é carregada
  const autoMateriais = useAutoMateriais(pedidoId, previousStageData);

  useEffect(() => {
    setLocalData(progress?.data || {});
    setHasChanges(false);
  }, [progress]);

  // Auto-expand next stage when previous completes
  useEffect(() => {
    if (isNextStage && !isCompleted) {
      setExpanded(true);
    }
  }, [isNextStage, isCompleted]);

  // Auto-populate materiais when detected and etapa is checklist_materiais
  useEffect(() => {
    if (
      stage.field_type === "checklist_materiais" &&
      autoMateriais &&
      !progress?.data?.acessorios && // Only auto-populate if not already filled
      !progress?.data?.aluminios &&
      !progress?.data?.vidros
    ) {
      setLocalData((prev) => ({
        ...prev,
        acessorios: autoMateriais.acessorios,
        aluminios: autoMateriais.aluminios,
        vidros: autoMateriais.vidros,
      }));
      // Mark as having changes so user sees it was auto-populated
      if (autoMateriais.acessorios || autoMateriais.aluminios || autoMateriais.vidros) {
        setHasChanges(true);
      }
    }
  }, [autoMateriais, stage.field_type, progress?.data]);

  const updateField = useCallback((key: string, value: unknown) => {
    setLocalData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const handleSave = async (markComplete = false) => {
    setSaving(true);
    try {
      const newStatus = markComplete ? "concluido" : progress?.status || "pendente";
      const payload = {
        pedido_id: pedidoId,
        stage_id: stage.id,
        status: newStatus,
        data: localData,
        completed_at: markComplete ? new Date().toISOString() : progress?.completed_at || null,
        completed_by: markComplete ? user?.id : null,
        updated_at: new Date().toISOString(),
      };

      if (progress?.id) {
        await supabase.from("order_progress").update(payload).eq("id", progress.id);
      } else {
        await supabase.from("order_progress").insert(payload);
      }

      setHasChanges(false);

      if (markComplete) {
        toast.success(`✅ "${stage.name}" concluída com sucesso!`, {
          description: "Próxima etapa desbloqueada →",
          duration: 3000,
        });
        onStageComplete?.();
        setExpanded(false);
      } else {
        toast.success("💾 Dados salvos com sucesso!", {
          duration: 2000,
        });
      }

      onUpdate();
    } catch (error) {
      toast.error("❌ Erro ao salvar");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (
      confirm(
        `Tem certeza que deseja pular "${stage.name}"? Esta ação pode afetar o fluxo do pedido.`
      )
    ) {
      await handleSave(true);
    }
  };

  const handleReopen = async () => {
    setSaving(true);
    try {
      if (progress?.id) {
        await supabase
          .from("order_progress")
          .update({
            status: "pendente",
            completed_at: null,
            completed_by: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", progress.id);
        onUpdate();
        toast.success("Etapa reaberta");
        setExpanded(true);
      }
    } catch (error) {
      toast.error("Erro ao reabrir");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const renderFields = () => {
    switch (stage.field_type) {
      case "medidas":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  Largura (mm)
                </Label>
                <Input
                  type="number"
                  placeholder="2000"
                  value={localData.largura || ""}
                  onChange={(e) => updateField("largura", e.target.value)}
                  disabled={isCompleted}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  Altura (mm)
                </Label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={localData.altura || ""}
                  onChange={(e) => updateField("altura", e.target.value)}
                  disabled={isCompleted}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                Anotações
              </Label>
              <Textarea
                placeholder="Observações sobre as medidas..."
                value={localData.anotacoes || ""}
                onChange={(e) => updateField("anotacoes", e.target.value)}
                disabled={isCompleted}
                className="mt-1 min-h-[80px]"
              />
            </div>
          </div>
        );

      case "checklist_materiais":
        return (
          <div className="space-y-3">
            {["Acessórios", "Alumínios", "Vidros"].map((item) => {
              const key = item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              return (
                <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <Checkbox
                    checked={!!localData[key]}
                    onCheckedChange={(checked) => updateField(key, checked)}
                    disabled={isCompleted}
                  />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                  {localData[key] && (
                    <span className="ml-auto text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      ✓ Confirmado
                    </span>
                  )}
                </div>
              );
            })}
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                Observações
              </Label>
              <Textarea
                placeholder="Detalhes sobre materiais..."
                value={localData.observacoes || ""}
                onChange={(e) => updateField("observacoes", e.target.value)}
                disabled={isCompleted}
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>
        );

      case "data_confirmacao":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  Data Prevista
                </Label>
                <Input
                  type="date"
                  value={localData.data_prevista || ""}
                  onChange={(e) => updateField("data_prevista", e.target.value)}
                  disabled={isCompleted}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  Data Realizada
                </Label>
                <Input
                  type="date"
                  value={localData.data_realizada || ""}
                  onChange={(e) => updateField("data_realizada", e.target.value)}
                  disabled={isCompleted}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                Observações
              </Label>
              <Textarea
                placeholder="Notas sobre a execução..."
                value={localData.observacoes || ""}
                onChange={(e) => updateField("observacoes", e.target.value)}
                disabled={isCompleted}
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>
        );

      case "upload_fotos":
        return (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">Upload de fotos (em breve)</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">
                Observações
              </Label>
              <Textarea
                placeholder="Descrição das fotos..."
                value={localData.observacoes || ""}
                onChange={(e) => updateField("observacoes", e.target.value)}
                disabled={isCompleted}
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>
        );

      case "texto_livre":
      default:
        return (
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Relatório / Observações
            </Label>
            <Textarea
              placeholder="Descreva o resultado desta etapa..."
              value={localData.texto || ""}
              onChange={(e) => updateField("texto", e.target.value)}
              disabled={isCompleted}
              className="mt-1 min-h-[100px]"
            />
          </div>
        );
    }
  };

  return (
    <div
      data-step-index={index}
      className={cn(
        "rounded-lg border transition-all duration-800",
        isCompleted
          ? "border-emerald-500/50 bg-emerald-500/5 shadow-sm"
          : expanded
            ? "border-primary/50 bg-card shadow-lg"
            : isNextStage
              ? "border-blue-500/50 bg-blue-500/2 hover:border-blue-500/70"
              : "border-border bg-card opacity-60 hover:opacity-75"
      )}
    >
      {/* Accordion Header */}
      <button
        onClick={() => !isCompleted && setExpanded(!expanded)}
        disabled={isCompleted || (!expanded && !isNextStage)}
        className={cn(
          "w-full flex items-center gap-4 p-4 text-left transition-all duration-300",
          isCompleted
            ? "cursor-default"
            : (!expanded && !isNextStage)
              ? "cursor-not-allowed"
              : "hover:bg-muted/20 cursor-pointer"
        )}
      >
        {/* Step circle with animation */}
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all border-2 font-semibold text-sm",
            isCompleted
              ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
              : "border-primary/50 bg-primary/10 text-primary"
          )}
        >
          {isCompleted ? (
            <Check className="h-5 w-5 animate-bounce" />
          ) : (
            <span>{index + 1}</span>
          )}
        </div>

        {/* Title & Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "text-sm font-semibold",
                isCompleted
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-foreground"
              )}
            >
              {stage.name}
            </p>
            {isNextStage && !isCompleted && (
              <span className="text-[10px] font-bold bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/50 animate-pulse shadow-sm">
                ⭐ PRÓXIMO
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {isCompleted
              ? `✓ Concluída em ${
                  progress?.completed_at
                    ? new Date(progress.completed_at).toLocaleDateString(
                        "pt-BR"
                      )
                    : "—"
                }`
              : "Aguardando..."}
          </p>
        </div>

        {/* Status badge */}
        <span
          className={cn(
            "text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap",
            isCompleted
              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : "bg-amber-500/20 text-amber-700 dark:text-amber-400"
          )}
        >
          {isCompleted ? "✓ Concluído" : "⏳ Pendente"}
        </span>

        {!isCompleted && (
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform shrink-0",
              expanded && "rotate-180"
            )}
          />
        )}
      </button>

      {/* Accordion Content */}
      {expanded && !isCompleted && (
        <div className="px-4 pb-4 pt-0 border-t border-primary/20 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="pt-4 space-y-4">
            {renderFields()}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-4">
              {hasChanges && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="h-3.5 w-3.5" /> Salvar Rascunho
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 min-w-[140px]"
              >
                <Check className="h-3.5 w-3.5" /> Concluir Etapa
              </Button>

              {index < totalSteps - 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={saving}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  title="Marca como concluída e passa para próxima"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {hasChanges && (
              <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded p-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Você tem alterações não salvas
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completed state */}
      {isCompleted && (
        <div className="px-4 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="h-4 w-4" />
            Etapa concluída com sucesso
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReopen}
            disabled={saving}
            className="text-[10px] h-auto py-1 px-2"
          >
            Reabrir
          </Button>
        </div>
      )}
    </div>
  );
}
