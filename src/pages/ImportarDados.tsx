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
import { cn } from "@/lib/utils";

export default function ImportarDados() {
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
      const { error } = await supabase.from("orcamento_itens").insert({
        orcamento_id: selectedOrcamentoId,
        descricao: `Importado de arquivo (${extractedData.source.toUpperCase()})`,
        largura: Math.round(extractedData.largura),
        altura: Math.round(extractedData.altura),
        quantidade: extractedData.quantidade || 1,
        valor_unitario: 0,
        observacoes: `Dados extraídos com ${Math.round(extractedData.confidence * 100)}% de confiança`,
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["bom-itens", selectedOrcamentoId] });
      toast.success("Item adicionado ao orçamento com sucesso!");

      // Reset
      setExtractedData(null);
      setSelectedOrcamentoId("");
    } catch (err) {
      toast.error(`Erro ao salvar: ${err instanceof Error ? err.message : "Desconhecido"}`);
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Importar Dados</h1>
          <p className="text-sm text-muted-foreground">
            Carregue arquivos PDF ou CSV para extrair dimensões e adicionar itens aos orçamentos
          </p>
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
                  <span className="text-sm text-white/60">Processando arquivo...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-white/40" />
                  <p className="text-sm font-medium text-white/70">Arraste o arquivo aqui</p>
                  <p className="text-xs text-white/50">ou clique para selecionar</p>
                  <p className="text-xs text-white/40 mt-2">PDF ou CSV (máx. 10MB)</p>
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
                  <span className="text-white/60">Confiança</span>
                  <span className={`font-medium ${confidenceColor}`}>
                    {Math.round(extractedData.confidence * 100)}%
                  </span>
                </div>
                <Progress value={extractedData.confidence * 100} className="h-2" />
              </div>

              {/* Extracted Values Grid */}
              <div className="grid grid-cols-3 gap-3">
                {extractedData.largura && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-white/60">Largura</p>
                    <p className="text-sm font-semibold text-white/90">{extractedData.largura.toFixed(1)}</p>
                    <Badge variant="secondary" className="text-[10px] w-full text-center">
                      mm
                    </Badge>
                  </div>
                )}
                {extractedData.altura && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-white/60">Altura</p>
                    <p className="text-sm font-semibold text-white/90">{extractedData.altura.toFixed(1)}</p>
                    <Badge variant="secondary" className="text-[10px] w-full text-center">
                      mm
                    </Badge>
                  </div>
                )}
                {extractedData.quantidade && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-white/60">Quantidade</p>
                    <p className="text-sm font-semibold text-white/90">{extractedData.quantidade.toFixed(0)}</p>
                    <Badge variant="secondary" className="text-[10px] w-full text-center">
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
          <div className="text-xs text-white/50 space-y-1">
            <p>
              <strong>Dica:</strong> Nomeia suas colunas no CSV como "largura", "altura", "quantidade" para melhor extração.
            </p>
            <p>Exemplo: Largura: 1500 | Altura: 1200 | Quantidade: 2</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
