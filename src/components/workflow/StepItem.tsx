import { useState, useEffect, useCallback } from "react";
import { Check, Save, ChevronDown, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

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
    data: Record<string, any>;
    completed_at?: string | null;
  } | null;
  pedidoId: string;
  index: number;
  totalSteps: number;
  onUpdate: () => void;
}

export function StepItem({ stage, progress, pedidoId, index, totalSteps, onUpdate }: StepItemProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [localData, setLocalData] = useState<Record<string, any>>(progress?.data || {});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const isCompleted = progress?.status === "concluido";

  useEffect(() => {
    setLocalData(progress?.data || {});
    setHasChanges(false);
  }, [progress]);

  const updateField = useCallback((key: string, value: any) => {
    setLocalData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const handleSave = async (markComplete = false) => {
    setSaving(true);
    try {
      const newStatus = markComplete ? "concluido" : (progress?.status || "pendente");
      const payload = {
        pedido_id: pedidoId,
        stage_id: stage.id,
        status: newStatus,
        data: localData,
        completed_at: markComplete ? new Date().toISOString() : (progress?.completed_at || null),
        completed_by: markComplete ? user?.id : null,
        updated_at: new Date().toISOString(),
      };

      if (progress?.id) {
        await supabase.from("order_progress").update(payload).eq("id", progress.id);
      } else {
        await supabase.from("order_progress").insert(payload);
      }

      setHasChanges(false);
      onUpdate();
      toast.success(markComplete ? `"${stage.name}" concluída!` : "Dados salvos!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleReopen = async () => {
    setSaving(true);
    try {
      if (progress?.id) {
        await supabase.from("order_progress").update({
          status: "pendente",
          completed_at: null,
          completed_by: null,
          updated_at: new Date().toISOString(),
        }).eq("id", progress.id);
        onUpdate();
        toast.success("Etapa reaberta");
      }
    } catch {
      toast.error("Erro ao reabrir");
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
                <Label className="text-xs font-medium text-muted-foreground">Largura (mm)</Label>
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
                <Label className="text-xs font-medium text-muted-foreground">Altura (mm)</Label>
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
              <Label className="text-xs font-medium text-muted-foreground">Anotações</Label>
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
                      Confirmado
                    </span>
                  )}
                </div>
              );
            })}
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Observações</Label>
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
                <Label className="text-xs font-medium text-muted-foreground">Data Prevista</Label>
                <Input
                  type="date"
                  value={localData.data_prevista || ""}
                  onChange={(e) => updateField("data_prevista", e.target.value)}
                  disabled={isCompleted}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Data Realizada</Label>
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
              <Label className="text-xs font-medium text-muted-foreground">Observações</Label>
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
              <Label className="text-xs font-medium text-muted-foreground">Observações</Label>
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
            <Label className="text-xs font-medium text-muted-foreground">Relatório / Observações</Label>
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
      className={cn(
        "rounded-xl border transition-all duration-300",
        isCompleted
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-border bg-card"
      )}
    >
      {/* Accordion Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        {/* Step circle */}
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all border-2",
            isCompleted
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-primary/30 bg-primary/5 text-primary"
          )}
        >
          {isCompleted ? (
            <Check className="h-5 w-5" />
          ) : (
            <span className="text-sm font-bold">{index + 1}</span>
          )}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-semibold",
            isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
          )}>
            {stage.name}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {isCompleted
              ? `Concluída em ${progress?.completed_at ? new Date(progress.completed_at).toLocaleDateString("pt-BR") : "—"}`
              : "Pendente"
            }
          </p>
        </div>

        {/* Status badge */}
        <span className={cn(
          "text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0",
          isCompleted
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
            : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        )}>
          {isCompleted ? "Concluído" : "Pendente"}
        </span>

        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform shrink-0",
          expanded && "rotate-180"
        )} />
      </button>

      {/* Accordion Content */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50">
          <div className="pt-4 space-y-4">
            {renderFields()}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              {!isCompleted ? (
                <>
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
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="h-3.5 w-3.5" /> Concluir Etapa
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReopen}
                  disabled={saving}
                >
                  Reabrir Etapa
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
