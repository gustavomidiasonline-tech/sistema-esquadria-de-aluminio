import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { PagamentoDialogState } from '@/hooks/useServicos';

interface PagForm {
  valor: string;
  forma_pagamento: string;
  observacoes: string;
}

interface PagamentoDialogProps {
  dialog: PagamentoDialogState | null;
  form: PagForm;
  onFormChange: (form: PagForm) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function PagamentoDialog({ dialog, form, onFormChange, onClose, onConfirm }: PagamentoDialogProps) {
  const set = (field: Partial<PagForm>) => onFormChange({ ...form, ...field });

  return (
    <Dialog open={!!dialog} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento - Serviço #{dialog?.numero}</DialogTitle>
          <DialogDescription>Registre um pagamento vinculado a este serviço.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Valor (R$) <span className="text-destructive">*</span></Label>
            <Input type="number" value={form.valor} onChange={(e) => set({ valor: e.target.value })} className="mt-1" placeholder="0,00" />
          </div>
          <div>
            <Label>Forma de pagamento</Label>
            <Select value={form.forma_pagamento} onValueChange={(v) => set({ forma_pagamento: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => set({ observacoes: e.target.value })} className="mt-1" placeholder="Observações opcionais..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onConfirm}>Registrar Pagamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
