import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { parseInventoryImportFile, type InventoryImportItem } from '@/services/inventory-import.service';
import { InventoryService } from '@/services/inventory.service';
import { toast } from 'sonner';

interface InventoryImportDialogProps {
  companyId: string;
  trigger?: React.ReactNode;
}

export function InventoryImportDialog({ companyId, trigger }: InventoryImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InventoryImportItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setFileName(file.name);
    const result = await parseInventoryImportFile(file);
    setItems(result.items);
    setErrors(result.errors);
    setLoading(false);
  };

  const handleImport = async () => {
    if (!items.length) return;
    try {
      setLoading(true);
      await InventoryService.importarLote(companyId, items);
      toast.success(`Importado: ${items.length} item(ns)`);
      setItems([]);
      setErrors([]);
      setFileName(null);
      setOpen(false);
    } catch (err) {
      toast.error('Erro ao importar: ' + (err instanceof Error ? err.message : 'desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar itens
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Itens de Estoque</DialogTitle>
          <DialogDescription>
            Envie um arquivo CSV ou PDF com colunas: codigo, nome, tipo, quantidade, unidade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              id="inventory-upload"
              accept=".csv,.pdf"
              onChange={handleFileSelect}
              disabled={loading}
              className="hidden"
            />
            <label htmlFor="inventory-upload" className="cursor-pointer block">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Processando arquivo...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-7 w-7 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Clique para selecionar o CSV</p>
                  <p className="text-xs text-muted-foreground">CSV ou PDF</p>
                </div>
              )}
            </label>
          </div>

          {fileName && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Arquivo: {fileName}</span>
              <Badge variant="secondary">{items.length} item(ns)</Badge>
            </div>
          )}

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errors.slice(0, 3).map((err) => (
                  <div key={err}>{err}</div>
                ))}
                {errors.length > 3 && <div>+{errors.length - 3} erros</div>}
              </AlertDescription>
            </Alert>
          )}

          {items.length > 0 && errors.length === 0 && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Arquivo validado. Pronto para importar.
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Fechar
            </Button>
            <Button
              className="flex-1"
              onClick={handleImport}
              disabled={loading || items.length === 0 || errors.length > 0}
            >
              Importar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
