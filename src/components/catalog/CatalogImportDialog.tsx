/**
 * CatalogImportDialog — Importação local de catálogos de fabricantes
 * 100% local: PDF.js extrai texto → regex extrai dados → salva no banco.
 * Nenhuma API externa necessária.
 */

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Package, Layers, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { FileUploadService } from '@/services/file-upload.service';
import { CatalogParserService, type ParsedPerfil, type ParsedModelo } from '@/services/catalog-parser.service';
import { supabase } from '@/integrations/supabase/client';
import { InventoryService } from '@/services/inventory.service';
import { CatalogAuditService } from '@/services/catalog-audit.service';

interface CatalogImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = 'upload' | 'processing' | 'preview' | 'done';

interface PreviewData {
  fabricante: string;
  perfis: ParsedPerfil[];
  modelos: ParsedModelo[];
  confianca: number;
  linhasIgnoradas: number;
}

export function CatalogImportDialog({ open, onOpenChange, onSuccess }: CatalogImportDialogProps) {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [loading, setLoading] = useState(false);
  const [textoManual, setTextoManual] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTextoManual('');
    }
  }

  async function handleProcessar() {
    if (!selectedFile && !textoManual.trim()) {
      toast({
        title: 'Conteúdo necessário',
        description: 'Selecione um arquivo PDF/TXT ou cole o texto do catálogo.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      let texto = textoManual;

      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') {
          try {
            const result = await FileUploadService.processPDF(selectedFile);
            if (!result.success) {
              throw new Error(result.error ?? 'Falha desconhecida ao extrair texto do PDF');
            }
            if (!result.rawText || result.rawText.trim().length === 0) {
              throw new Error(
                'PDF processado mas nenhum texto foi extraído. Verifique se o PDF contém texto selecionável (não é apenas imagem escaneada).'
              );
            }
            texto = result.rawText;
          } catch (pdfError) {
            const errorMsg = pdfError instanceof Error ? pdfError.message : 'Erro desconhecido ao processar PDF';
            throw new Error(`Erro ao processar PDF: ${errorMsg}`);
          }
        } else if (ext === 'csv' || ext === 'txt') {
          // TXT/CSV: ler diretamente com fallback robusto
          try {
            texto = await selectedFile.text();
            if (!texto || texto.trim().length === 0) {
              throw new Error('Arquivo vazio ou ilegível');
            }
          } catch (readError) {
            throw new Error(`Erro ao ler arquivo: ${readError instanceof Error ? readError.message : 'Desconhecido'}`);
          }
        } else {
          throw new Error(`Tipo de arquivo não suportado: .${ext}. Use PDF, CSV ou TXT.`);
        }
      }

      if (!texto.trim()) {
        throw new Error('Nenhum texto extraído do arquivo. Tente colar o conteúdo manualmente.');
      }

      const result = CatalogParserService.parse(texto);

      if (result.perfis.length === 0 && result.modelos.length === 0) {
        throw new Error(
          'Nenhum perfil ou modelo detectado no texto. Verifique se o catálogo está em formato legível (não é imagem escaneada).',
        );
      }

      // Validar resultado do parsing com precisão 99%
      if (!result || typeof result !== 'object') {
        throw new Error('Erro ao processar catálogo: resultado inválido');
      }

      setPreview({
        fabricante: result.fabricante || 'Desconhecido',
        perfis: Array.isArray(result.perfis) ? result.perfis : [],
        modelos: Array.isArray(result.modelos) ? result.modelos : [],
        confianca: result.confianca ?? 0.5,
        linhasIgnoradas: result.linhasIgnoradas ?? 0,
      });
      setStep('preview');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido ao processar catálogo';
      console.error('Erro de importação:', err);
      toast({
        title: 'Erro no processamento',
        description: message,
        variant: 'destructive',
      });
      setStep('upload');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmar() {
    if (!preview) return;

    console.log('👤 Profile:', profile);
    console.log('🏢 CompanyId:', companyId);

    if (!companyId) {
      toast({
        title: 'Sessão expirada',
        description: 'Faça login novamente para continuar.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      let perfisSalvos = preview.perfis.length;
      let modelosSalvos = preview.modelos.length;

      // Tipos válidos conforme constraint window_models_tipo_check
      const VALID_TIPOS = ['correr', 'basculante', 'maxim-ar', 'fixo', 'pivotante', 'giro', 'balcao', 'camarao'];

      // Validar tipos antes de enviar para RPC
      const validarTipo = (tipo?: string) => {
        if (!tipo || !VALID_TIPOS.includes(tipo.toLowerCase())) {
          return 'fixo'; // Fallback seguro
        }
        return tipo.toLowerCase();
      };

      // Tentar importação atômica via RPC (requer migration 20260316020000)
      const perfisBatch = preview.perfis.map((p) => ({
        codigo: p.codigo,
        nome: p.nome,
        tipo: p.tipo || 'perfil',
        peso_kg_m: p.peso_kg_m,
        espessura_mm: p.espessura_mm,
      }));
      const modelosBatch = preview.modelos.map((m) => ({
        codigo: m.codigo,
        nome: m.nome,
        tipo: validarTipo(m.tipo),
        descricao: m.descricao,
      }));

      console.log('📤 Enviando para RPC:', {
        company_id: companyId,
        perfis_count: perfisBatch.length,
        modelos_count: modelosBatch.length,
        perfis: perfisBatch.slice(0, 2),
        modelos: modelosBatch.slice(0, 2),
      });

      // RPC com timeout de 5 minutos
      const rpcPromise = supabase.rpc('import_catalog_atomic', {
        p_company_id: companyId,
        p_perfis: perfisBatch,
        p_modelos: modelosBatch,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('RPC timeout: operação não completou em 5 minutos')), 5 * 60 * 1000)
      );

      const { data: rpcData, error: rpcError } = await Promise.race([
        rpcPromise as Promise<{ data: any; error: null }>,
        timeoutPromise as Promise<any>,
      ]).catch((err) => {
        if (err instanceof Error && err.message.includes('timeout')) {
          return { data: null, error: { message: err.message } };
        }
        throw err;
      });

      // Verificar se RPC não existe (função não está disponível)
      const isRpcNotFound = rpcError &&
        (rpcError.message?.includes('function') ||
         rpcError.message?.includes('does not exist') ||
         rpcError.code === '42883');

      if (!rpcError) {
        // RPC funcionou — usar contagens retornadas
        const result = rpcData as { perfis_salvos: number; modelos_salvos: number; company_id_usado: string; success: boolean };
        console.log('✅ RPC Success:', result);
        perfisSalvos = result.perfis_salvos;
        modelosSalvos = result.modelos_salvos;
        if (perfisSalvos === 0 && modelosSalvos === 0) {
          console.warn('⚠️ RPC retornou 0 itens salvos - verificar dados enviados');
        }
      } else if (isRpcNotFound) {
        console.log('⚠️ RPC não disponível, usando fallback delete+insert');

        // RPC não existe — fallback delete+insert
        try {
          if (preview.perfis.length > 0) {
            const perfisBatch = preview.perfis.map((p) => ({
              company_id: companyId,
              codigo: p.codigo,
              nome: p.nome,
              tipo: p.tipo,
              peso_kg_m: p.peso_kg_m,
              espessura_mm: p.espessura_mm,
            }));
            const codigos = preview.perfis.map((p) => p.codigo);

            // Deletar perfis existentes
            const deleteResult = await supabase
              .from('perfis_catalogo')
              .delete()
              .eq('company_id', companyId)
              .in('codigo', codigos);

            if (deleteResult.error) {
              console.warn('⚠️ Erro ao deletar perfis existentes:', deleteResult.error.message);
            }

            // Inserir em batches de 50
            for (let i = 0; i < perfisBatch.length; i += 50) {
              const batch = perfisBatch.slice(i, i + 50);
              const { error } = await supabase.from('perfis_catalogo').insert(batch);
              if (error) {
                throw new Error(`Erro ao salvar perfis (batch ${Math.ceil(i / 50 + 1)}): ${error.message}`);
              }
            }
            perfisSalvos = preview.perfis.length;
          }

          if (preview.modelos.length > 0) {
            const modelosBatch = preview.modelos.map((m) => ({
              company_id: companyId,
              codigo: m.codigo,
              nome: m.nome,
              tipo: m.tipo,
              descricao: m.descricao,
              ativo: true,
            }));
            const codigos = preview.modelos.map((m) => m.codigo);

            // Deletar modelos existentes
            const deleteResult = await supabase
              .from('window_models')
              .delete()
              .eq('company_id', companyId)
              .in('codigo', codigos);

            if (deleteResult.error) {
              console.warn('⚠️ Erro ao deletar modelos existentes:', deleteResult.error.message);
            }

            // Inserir em batches de 50
            for (let i = 0; i < modelosBatch.length; i += 50) {
              const batch = modelosBatch.slice(i, i + 50);
              const { error } = await supabase.from('window_models').insert(batch);
              if (error) {
                throw new Error(`Erro ao salvar modelos (batch ${Math.ceil(i / 50 + 1)}): ${error.message}`);
              }
            }
            modelosSalvos = preview.modelos.length;
          }
        } catch (fallbackErr) {
          throw new Error(`Falha no fallback delete+insert: ${fallbackErr instanceof Error ? fallbackErr.message : 'Desconhecido'}`);
        }
      } else {
        throw new Error(`Erro ao importar catálogo: ${rpcError.message || 'Desconhecido'}`);
      }

      // Auto-sync catalog profiles → inventory items
      let syncMsg = '';
      if (companyId && perfisSalvos > 0) {
        try {
          console.log('🔄 Sincronizando perfis do catálogo com estoque...');
          const syncResult = await InventoryService.sincronizarDeCatalogo(companyId);
          console.log('✅ Sincronização completa:', syncResult);
          if (syncResult.inserted > 0) {
            syncMsg = ` | ${syncResult.inserted} perfil(is) adicionado(s) ao estoque.`;
          }
        } catch (syncErr) {
          const syncErrorMsg = syncErr instanceof Error ? syncErr.message : 'Desconhecido';
          console.error('❌ Auto-sync catálogo → estoque falhou:', syncErr);
          throw new Error(`Importação OK, mas sincronização com estoque falhou: ${syncErrorMsg}`);
        }
      }

      setStep('done');

      // Registrar import na auditoria
      const duration = Date.now() - startTime;
      await CatalogAuditService.logImport(companyId, profile?.id, {
        company_id: companyId,
        file_name: selectedFile?.name || 'manual-input',
        fabricante: preview.fabricante,
        perfis_importados: perfisSalvos,
        modelos_importados: modelosSalvos,
        perfis_sincronizados: syncMsg.includes('perfil') ? perfisSalvos : 0,
        status: 'sucesso',
        duration_ms: duration,
      });

      toast({
        title: 'Catálogo importado!',
        description: `${perfisSalvos} perfis e ${modelosSalvos} modelos salvos no sistema.${syncMsg}`,
      });
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar no banco de dados';
      const duration = Date.now() - startTime;

      // Registrar erro na auditoria
      if (companyId && profile?.id) {
        await CatalogAuditService.logImport(companyId, profile.id, {
          company_id: companyId,
          file_name: selectedFile?.name || 'manual-input',
          fabricante: preview?.fabricante || 'Desconhecido',
          perfis_importados: 0,
          modelos_importados: 0,
          perfis_sincronizados: 0,
          status: 'falha',
          error_message: message,
          duration_ms: duration,
        });
      }

      toast({ title: 'Erro ao salvar', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function handleFechar() {
    setStep('upload');
    setSelectedFile(null);
    setTextoManual('');
    setPreview(null);
    setLoading(false);
    onOpenChange(false);
  }

  const confiancaVariant =
    (preview?.confianca ?? 0) >= 0.8
      ? 'default'
      : (preview?.confianca ?? 0) >= 0.5
        ? 'secondary'
        : 'destructive';

  return (
    <Dialog open={open} onOpenChange={handleFechar}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Catálogo de Fabricante
          </DialogTitle>
          <DialogDescription>
            Extração local via fórmulas inteligentes — sem API externa, sem custo adicional.
          </DialogDescription>
        </DialogHeader>

        {/* ── STEP: UPLOAD ── */}
        {step === 'upload' && (
          <div className="space-y-4">
            {/* Dropzone */}
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <button
                    className="ml-2 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">Arraste ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, TXT ou CSV de catálogo técnico</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.csv,.text"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou cole o texto</span>
              </div>
            </div>

            <Textarea
              placeholder="Cole aqui o conteúdo do catálogo técnico (lista de perfis, tabela de códigos, etc.)..."
              value={textoManual}
              onChange={(e) => {
                setTextoManual(e.target.value);
                setSelectedFile(null);
              }}
              rows={6}
              className="resize-none font-mono text-xs"
            />

            <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-300">
              <strong>Como funciona:</strong> o sistema usa padrões regex para detectar automaticamente
              códigos de perfil (ex: A1234, PRF-456), pesos (kg/m), espessuras (mm) e tipos de peça.
              Funciona melhor com PDFs com texto selecionável.
            </div>

            <Button
              className="w-full"
              onClick={handleProcessar}
              disabled={loading || (!selectedFile && !textoManual.trim())}
            >
              Extrair dados do catálogo
            </Button>
          </div>
        )}

        {/* ── STEP: PROCESSING ── */}
        {step === 'processing' && (
          <div className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Extraindo dados localmente...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Aplicando padrões regex para detectar perfis e modelos.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP: PREVIEW ── */}
        {step === 'preview' && preview && (
          <div className="space-y-4">
            {/* Resumo */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Fabricante detectado</span>
                <Badge variant="outline">{preview.fabricante}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-md bg-muted/40 p-3">
                  <Package className="h-5 w-5 mx-auto mb-1 text-blue-400" />
                  <p className="text-2xl font-bold">{preview.perfis.length}</p>
                  <p className="text-xs text-muted-foreground">Perfis</p>
                </div>
                <div className="rounded-md bg-muted/40 p-3">
                  <Layers className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
                  <p className="text-2xl font-bold">{preview.modelos.length}</p>
                  <p className="text-xs text-muted-foreground">Modelos</p>
                </div>
                <div className="rounded-md bg-muted/40 p-3">
                  <CheckCircle className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{Math.round(preview.confianca * 100)}%</p>
                  <p className="text-xs text-muted-foreground">Confiança</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                {preview.linhasIgnoradas} linhas sem dados reconhecíveis ignoradas
              </div>

              {preview.confianca < 0.5 && (
                <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 p-2 text-xs text-yellow-300">
                  Confiança baixa. O PDF pode conter imagens escaneadas. Revise os dados antes de confirmar.
                </div>
              )}
            </div>

            {/* Preview de perfis */}
            {preview.perfis.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Prévia dos perfis{' '}
                  <Badge variant={confiancaVariant} className="ml-1 text-xs">
                    {preview.perfis.length} detectados
                  </Badge>
                </p>
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-2 text-muted-foreground">Código</th>
                        <th className="text-left p-2 text-muted-foreground">Nome</th>
                        <th className="text-left p-2 text-muted-foreground">Tipo</th>
                        <th className="text-right p-2 text-muted-foreground">Peso</th>
                        <th className="text-right p-2 text-muted-foreground">Esp.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.perfis.slice(0, 10).map((p, i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="p-2 font-mono text-blue-300">{p.codigo}</td>
                          <td className="p-2 max-w-[180px] truncate">{p.nome}</td>
                          <td className="p-2">
                            <Badge variant="secondary" className="text-xs">{p.tipo}</Badge>
                          </td>
                          <td className="p-2 text-right text-muted-foreground">
                            {p.peso_kg_m != null ? `${p.peso_kg_m.toFixed(3)} kg/m` : '—'}
                          </td>
                          <td className="p-2 text-right text-muted-foreground">
                            {p.espessura_mm != null ? `${p.espessura_mm} mm` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.perfis.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center py-2 bg-muted/20">
                      + {preview.perfis.length - 10} perfis adicionais serão importados
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('upload')} disabled={loading}>
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmar}
                disabled={loading || (preview.perfis.length === 0 && preview.modelos.length === 0)}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar importação
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === 'done' && preview && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <div>
              <p className="font-semibold text-lg">Catálogo importado com sucesso!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {preview.perfis.length} perfis e {preview.modelos.length} modelos de{' '}
                <strong>{preview.fabricante}</strong> foram adicionados ao sistema.
              </p>
            </div>
            <Button onClick={handleFechar}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
