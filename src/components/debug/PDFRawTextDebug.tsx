import { useState, useRef } from 'react';
import { FileText, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileUploadService } from '@/services/file-upload.service';

export function PDFRawTextDebug() {
  const [rawText, setRawText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await FileUploadService.processPDF(file);
      if (result.success && result.rawText) {
        setRawText(result.rawText);
        console.log('📄 RAW PDF TEXT (primeiras 2000 chars):', result.rawText.slice(0, 2000));
      } else {
        setRawText('❌ Erro ao extrair PDF');
      }
    } catch (err) {
      setRawText(`❌ Erro: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }

  function downloadRawText() {
    const blob = new Blob([rawText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pdf-raw-text.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(rawText);
    alert('✅ Copiado para área de transferência');
  }

  return (
    <div className="p-4 border-2 border-green-500 bg-green-50 rounded-lg space-y-2 mb-4">
      <h3 className="font-bold text-sm">📄 Debug: Extração RAW do PDF</h3>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          {loading ? 'Processando...' : 'Carregar PDF'}
        </Button>
        <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFile} hidden />

        {rawText && (
          <>
            <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
              <Copy className="h-4 w-4" /> Copiar
            </Button>
            <Button variant="outline" size="sm" onClick={downloadRawText} className="gap-2">
              <Download className="h-4 w-4" /> Baixar TXT
            </Button>
          </>
        )}
      </div>

      {rawText && (
        <div className="text-xs bg-white p-3 rounded border border-gray-300 max-h-96 overflow-auto whitespace-pre-wrap font-mono">
          {rawText.slice(0, 3000)}
          {rawText.length > 3000 && `\n\n... (${rawText.length} caracteres total) ...`}
        </div>
      )}
    </div>
  );
}
