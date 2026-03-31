import { AppLayout } from "@/components/AppLayout";
import { Upload, FileJson, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUploadService, type ExtractedData } from "@/services/file-upload.service";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/ui/BackButton";

export default function ImportarDados() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrcamentoId, setSelectedOrcamentoId] = useState<string>("");

  interface OrcamentoRow {
    id: string;
    numero: number;
    descricao: string;
    clientes: { nome: string } | null;
  }

  const { data: orcamentos = [] } = useQuery<OrcamentoRow[]>({
    queryKey: ["importar-orcamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("id, numero, descricao, clientes(nome)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);

    const result = await FileUploadService.processFile(file);

    if (result.success && result.data) {
      setExtractedData(result.data);
    } else {
      setError(result.error || "Erro ao processar arquivo");
    }

    setLoading(false);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSaveToOrcamento = async () => {
    if (!extractedData || !selectedOrcamentoId) {
      toast.error("Selecione um orçamento antes de salvar");
      return;
    }

    if (!extractedData.largura || !extractedData.altura) {
      toast.error("Dados de largura e altura são necessários");
      return;
    }

    setLoading(true);
    try {
      const qty = Math.round(extractedData.quantidade || 1);
      const { error } = await supabase.from("orcamento_itens").insert({
        orcamento_id: selectedOrcamentoId,
        company_id: profile?.company_id,
        descricao: `Importado de arquivo (${extractedData.source.toUpperCase()})`,
        largura: Math.round(extractedData.largura),
        altura: Math.round(extractedData.altura),
        quantidade: qty,
        valor_unitario: 0,
        valor_total: 0,
      });

      if (error) throw new Error(error.message);

      await queryClient.invalidateQueries({ queryKey: ["bom-itens", selectedOrcamentoId] });
      await queryClient.invalidateQueries({ queryKey: ["orcamento_itens"] });
      toast.success("Item adicionado ao orçamento com sucesso!");

      // Reset
      setExtractedData(null);
      setSelectedOrcamentoId("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error("Erro ao salvar item no orçamento:", err);
      toast.error(`Erro ao salvar: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const confidenceColor = extractedData
    ? extractedData.confidence >= 0.8
      ? "text-emerald-600"
      : extractedData.confidence >= 0.6
        ? "text-amber-600"
        : "text-orange-600"
    : "";

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton to="/materiais" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Importar Dados</h1>
            <p className="text-sm text-muted-foreground">
              Carregue arquivos PDF ou CSV para extrair dimensões e adicionar itens aos orçamentos
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="glass-card-premium p-8 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive ? "border-blue-500 bg-blue-500/15" : "border-white/20 hover:border-white/40"
            }`}
          >
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.csv,.txt"
              onChange={handleFileSelect}
              disabled={loading}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin">
                    <FileJson className="h-8 w-8 text-blue-500" />
                  </div>
                  <span className="text-sm text-foreground/70 font-medium">Processando arquivo...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-10 w-10 mx-auto text-primary/60" />
                  <p className="text-sm font-bold text-foreground/80 tracking-tight">Arraste o arquivo aqui</p>
                  <p className="text-xs text-muted-foreground">ou clique para selecionar</p>
                  <p className="text-[10px] uppercase font-bold text-primary/40 mt-3 letter-spacing-widest">PDF ou CSV (máx. 10MB)</p>
                </div>
              )}
            </label>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Display */}
          {extractedData && (
            <div className="space-y-4 border rounded-lg p-4 bg-white/5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h4 className="font-medium text-sm">Dados Extraídos com Sucesso</h4>
              </div>

              {/* Confidence */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Confiança</span>
                  <span className={`font-bold ${confidenceColor}`}>
                    {Math.round(extractedData.confidence * 100)}%
                  </span>
                </div>
                <Progress value={extractedData.confidence * 100} className="h-2" />
              </div>

              {/* Extracted Values Grid */}
              <div className="grid grid-cols-3 gap-3">
                {extractedData.largura && (
                  <div className="space-y-1 text-center bg-primary/5 p-2 rounded-lg border border-primary/10">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Largura</p>
                    <p className="text-lg font-black text-foreground">{extractedData.largura.toFixed(1)}</p>
                    <Badge variant="secondary" className="text-[10px] w-full text-center bg-primary/10 hover:bg-primary/20 text-primary border-none">
                      mm
                    </Badge>
                  </div>
                )}
                {extractedData.altura && (
                  <div className="space-y-1 text-center bg-primary/5 p-2 rounded-lg border border-primary/10">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Altura</p>
                    <p className="text-lg font-black text-foreground">{extractedData.altura.toFixed(1)}</p>
                    <Badge variant="secondary" className="text-[10px] w-full text-center bg-primary/10 hover:bg-primary/20 text-primary border-none">
                      mm
                    </Badge>
                  </div>
                )}
                {extractedData.quantidade && (
                  <div className="space-y-1 text-center bg-primary/5 p-2 rounded-lg border border-primary/10">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Qtd</p>
                    <p className="text-lg font-black text-foreground">{extractedData.quantidade.toFixed(0)}</p>
                    <Badge variant="secondary" className="text-[10px] w-full text-center bg-primary/10 hover:bg-primary/20 text-primary border-none">
                      un
                    </Badge>
                  </div>
                )}
              </div>

              {/* Orcamento Selection */}
              <div className="space-y-2 pt-4 border-t">
                <label className="text-xs font-medium">Adicionar a qual orçamento?</label>
                <Select value={selectedOrcamentoId} onValueChange={setSelectedOrcamentoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um orçamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {orcamentos.map((orc) => (
                      <SelectItem key={orc.id} value={orc.id}>
                        ORC-{orc.numero} - {orc.clientes?.nome || "Sem cliente"} - {orc.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setExtractedData(null);
                    setError(null);
                  }}
                  className="flex-1"
                >
                  Carregar Outro
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveToOrcamento}
                  disabled={!selectedOrcamentoId || loading}
                  className="flex-1"
                >
                  {loading ? "Salvando..." : "Salvar no Orçamento"}
                </Button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-[10px] text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg border border-border/50">
            <p className="font-semibold text-foreground/70 mb-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Dica de Extração
            </p>
            <p>
              Nomeie suas colunas no CSV como "largura", "altura", "quantidade" para melhor extração automática.
            </p>
            <p className="opacity-80 italic">Exemplo: Largura: 1500 | Altura: 1200 | Quantidade: 2</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
