import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { FileUploadService, type ExtractedData } from '@/services/file-upload.service';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface FileUploadDialogProps {
  onDataExtracted?: (data: ExtractedData) => void;
  trigger?: React.ReactNode;
}

export function FileUploadDialog({ onDataExtracted, trigger }: FileUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);

    const result = await FileUploadService.processFile(file);

    if (result.success && result.data) {
      setExtractedData(result.data);
      if (onDataExtracted) {
        onDataExtracted(result.data);
      }
    } else {
      setError(result.error || 'Erro ao processar arquivo');
    }

    setLoading(false);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
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

  const confidenceColor = extractedData
    ? extractedData.confidence >= 0.8
      ? 'text-emerald-600'
      : extractedData.confidence >= 0.6
        ? 'text-amber-600'
        : 'text-orange-600'
    : '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar PDF/CSV
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Arquivo PDF/CSV</DialogTitle>
          <DialogDescription>
            Carregue um arquivo PDF ou CSV com as dimensões (largura, altura) e quantidade. O sistema extrairá os números
            automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
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
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-600">Processando arquivo...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">Arraste o arquivo aqui</p>
                  <p className="text-xs text-gray-500">ou clique para selecionar</p>
                  <p className="text-xs text-gray-400 mt-2">PDF ou CSV (máx. 10MB)</p>
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
            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h4 className="font-medium text-sm">Dados Extraídos com Sucesso</h4>
              </div>

              {/* Confidence */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Confiança</span>
                  <span className={`font-medium ${confidenceColor}`}>
                    {Math.round(extractedData.confidence * 100)}%
                  </span>
                </div>
                <Progress value={extractedData.confidence * 100} className="h-2" />
              </div>

              {/* Extracted Values Grid */}
              <div className="grid grid-cols-3 gap-2">
                {extractedData.largura && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600">Largura</p>
                    <p className="text-sm font-semibold text-gray-900">{extractedData.largura.toFixed(1)}</p>
                    <Badge variant="secondary" className="text-[10px] w-full text-center">
                      mm
                    </Badge>
                  </div>
                )}
                {extractedData.altura && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600">Altura</p>
                    <p className="text-sm font-semibold text-gray-900">{extractedData.altura.toFixed(1)}</p>
                    <Badge variant="secondary" className="text-[10px] w-full text-center">
                      mm
                    </Badge>
                  </div>
                )}
                {extractedData.quantidade && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600">Quantidade</p>
                    <p className="text-sm font-semibold text-gray-900">{extractedData.quantidade.toFixed(0)}</p>
                    <Badge variant="secondary" className="text-[10px] w-full text-center">
                      un
                    </Badge>
                  </div>
                )}
              </div>

              {/* Source */}
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">Origem:</span>
                  <Badge variant="outline" className="text-[11px]">
                    {extractedData.source.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Close and Apply Buttons */}
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
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Aplicar e Fechar
                </Button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>
              <strong>Dica:</strong> Nomeie suas colunas no CSV como "largura", "altura", "quantidade" para melhor
              extração.
            </p>
            <p>Exemplo: Largura: 1500 | Altura: 1200 | Quantidade: 2</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
