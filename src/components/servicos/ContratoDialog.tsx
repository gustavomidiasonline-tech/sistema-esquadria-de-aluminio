import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ContratoDialogState } from '@/hooks/useServicos';

interface ContratoForm {
  titulo: string;
  descricao: string;
  valor: string;
}

interface ContratoDialogProps {
  dialog: ContratoDialogState | null;
  form: ContratoForm;
  onFormChange: (form: ContratoForm) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function ContratoDialog({ dialog, form, onFormChange, onClose, onConfirm }: ContratoDialogProps) {
  const set = (field: Partial<ContratoForm>) => onFormChange({ ...form, ...field });

  return (
    <Dialog open={!!dialog} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Contrato - Serviço #{dialog?.numero}</DialogTitle>
          <DialogDescription>Crie um contrato vinculado ao cliente deste serviço.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Título <span className="text-destructive">*</span></Label>
            <Input value={form.titulo} onChange={(e) => set({ titulo: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input type="number" value={form.valor} onChange={(e) => set({ valor: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={(e) => set({ descricao: e.target.value })} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onConfirm}>Criar Contrato</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
