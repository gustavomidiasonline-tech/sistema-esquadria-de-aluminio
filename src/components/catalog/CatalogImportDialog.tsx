/**
 * CatalogImportDialog — Importação de catálogos de fabricantes via IA
 * Upload de PDF/texto → processamento Claude → review → confirmar importação
 */

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Package, Layers } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CatalogImportService, type ImportJob } from '@/services/catalog-import.service';
import { useAuth } from '@/hooks/useAuth';

interface CatalogImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = 'upload' | 'processing' | 'review' | 'done';

interface ReviewData {
  jobId: string;
  fabricante: string;
  totalPerfis: number;
  totalModelos: number;
  confianca: number;
  avisos: string[];
}

export function CatalogImportDialog({ open, onOpenChange, onSuccess }: CatalogImportDialogProps) {
  const { companyId } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [textoManual, setTextoManual] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTextoManual('');
    }
  }

  async function handleIniciarImportacao() {
    if (!companyId) return;
    if (!apiKey.trim()) {
      toast({ title: 'API Key necessária', description: 'Insira sua chave da API Claude', variant: 'destructive' });
      return;
    }
    if (!selectedFile && !textoManual.trim()) {
      toast({ title: 'Conteúdo necessário', description: 'Selecione um arquivo ou cole o texto do catálogo', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      let conteudo = textoManual;
      let nomeArquivo = 'texto-manual.txt';

      if (selectedFile) {
        conteudo = await CatalogImportService.extrairTextoPDF(selectedFile);
        nomeArquivo = selectedFile.name;
      }

      const job = await CatalogImportService.iniciarImportacao(
        companyId,
        nomeArquivo,
        conteudo,
        apiKey
      );
      setCurrentJob(job);

      // Poll até concluir (máx 60s)
      const jobConcluido = await pollJobStatus(job.id, companyId);
      setCurrentJob(jobConcluido);

      // Buscar dados do job para review
      const { data } = await import('@/integrations/supabase/client').then((m) =>
        m.supabase
          .from('ai_import_jobs')
          .select('dados_para_import, total_perfis, total_modelos')
          .eq('id', job.id)
          .single()
      );

      if (data) {
        const dadosImport = data.dados_para_import as {
          fabricante?: string;
          confianca?: number;
          avisos?: string[];
        } | null;

        setReviewData({
          jobId: job.id,
          fabricante: dadosImport?.fabricante ?? 'Desconhecido',
          totalPerfis: (data.total_perfis as number) ?? 0,
          totalModelos: (data.total_modelos as number) ?? 0,
          confianca: dadosImport?.confianca ?? 0,
          avisos: dadosImport?.avisos ?? [],
        });
      }

      setStep('review');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar catálogo';
      toast({ title: 'Erro no processamento', description: message, variant: 'destructive' });
      setStep('upload');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmarImportacao() {
    if (!companyId || !reviewData) return;
    setLoading(true);

    try {
      await CatalogImportService.confirmarImportacao(reviewData.jobId, companyId);
      setStep('done');
      toast({
        title: 'Catálogo importado!',
        description: `${reviewData.totalPerfis} perfis e ${reviewData.totalModelos} modelos adicionados ao catálogo.`,
      });
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao confirmar importação';
      toast({ title: 'Erro ao confirmar', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function handleFechar() {
    setStep('upload');
    setSelectedFile(null);
    setTextoManual('');
    setReviewData(null);
    setCurrentJob(null);
    setLoading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleFechar}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Catálogo de Fabricante
          </DialogTitle>
          <DialogDescription>
            Use IA para extrair perfis e modelos automaticamente de catálogos técnicos.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">Chave API Claude (Anthropic)</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Necessária para extração por IA. Nunca armazenamos sua chave.
              </p>
            </div>

            {/* Upload arquivo */}
            <div className="space-y-2">
              <Label>Arquivo do Catálogo</Label>
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar PDF ou TXT
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.text"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Texto manual */}
            <div className="space-y-2">
              <Label htmlFor="textoManual">Cole o texto do catálogo</Label>
              <Textarea
                id="textoManual"
                placeholder="Cole aqui o conteúdo do catálogo técnico..."
                value={textoManual}
                onChange={(e) => {
                  setTextoManual(e.target.value);
                  setSelectedFile(null);
                }}
                rows={5}
                className="resize-none"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleIniciarImportacao}
              disabled={loading || (!selectedFile && !textoManual.trim()) || !apiKey.trim()}
            >
              Processar com IA
            </Button>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Analisando catálogo...</p>
              <p className="text-sm text-muted-foreground mt-1">
                A IA está extraindo perfis e modelos. Isso pode levar até 30 segundos.
              </p>
            </div>
          </div>
        )}

        {step === 'review' && reviewData && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Fabricante detectado</span>
                <Badge variant="outline">{reviewData.fabricante}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{reviewData.totalPerfis}</p>
                    <p className="text-xs text-muted-foreground">Perfis extraídos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{reviewData.totalModelos}</p>
                    <p className="text-xs text-muted-foreground">Modelos extraídos</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Confiança da extração:</span>
                <Badge
                  variant={
                    reviewData.confianca >= 0.8
                      ? 'default'
                      : reviewData.confianca >= 0.5
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {Math.round(reviewData.confianca * 100)}%
                </Badge>
              </div>
            </div>

            {reviewData.avisos.length > 0 && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/15 p-3 space-y-1">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Avisos da extração</span>
                </div>
                {reviewData.avisos.map((aviso, i) => (
                  <p key={i} className="text-sm text-yellow-400 ml-6">• {aviso}</p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('upload')}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmarImportacao}
                disabled={loading || (reviewData.totalPerfis === 0 && reviewData.totalModelos === 0)}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar Importação
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && reviewData && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div>
              <p className="font-medium text-lg">Catálogo importado com sucesso!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {reviewData.totalPerfis} perfis e {reviewData.totalModelos} modelos
                foram adicionados ao catálogo de {reviewData.fabricante}.
              </p>
            </div>
            <Button onClick={handleFechar}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Helper: poll job status ---

async function pollJobStatus(jobId: string, companyId: string): Promise<ImportJob> {
  const MAX_ATTEMPTS = 30;
  const INTERVAL_MS = 2000;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));

    const { supabase } = await import('@/integrations/supabase/client');
    const { data } = await supabase
      .from('ai_import_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('company_id', companyId)
      .single();

    if (!data) continue;

    const job = data as ImportJob;
    if (job.status === 'concluido' || job.status === 'erro') {
      if (job.status === 'erro') {
        throw new Error(job.erro ?? 'Erro desconhecido no processamento');
      }
      return job;
    }
  }

  throw new Error('Timeout: processamento demorou mais que o esperado');
}
