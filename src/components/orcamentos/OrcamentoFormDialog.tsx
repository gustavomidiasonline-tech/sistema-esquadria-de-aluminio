import { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const orcamentoSchema = z.object({
  cliente_id: z.string().min(1, 'Selecione um cliente'),
  descricao: z.string().optional(),
  valor_total: z.string().optional(),
  validade: z.string().optional(),
  observacoes: z.string().optional(),
});

type OrcamentoFormValues = z.infer<typeof orcamentoSchema>;

interface Cliente {
  id: string;
  nome: string;
}

interface OrcamentoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: Cliente[];
  isPending?: boolean;
  onSave: (values: OrcamentoFormValues) => Promise<void>;
}

const FORM_VAZIO: OrcamentoFormValues = {
  cliente_id: '', descricao: '', valor_total: '', validade: '', observacoes: '',
};

export function OrcamentoFormDialog({ open, onOpenChange, clientes, isPending, onSave }: OrcamentoFormDialogProps) {
  const [form, setForm] = useState<OrcamentoFormValues>(FORM_VAZIO);
  const [errors, setErrors] = useState<Partial<Record<keyof OrcamentoFormValues, string>>>({});

  const handleClose = () => {
    setForm(FORM_VAZIO);
    setErrors({});
    onOpenChange(false);
  };

  const handleSave = async () => {
    const result = orcamentoSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((e) => {
        const field = e.path[0] as keyof OrcamentoFormValues;
        fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      toast.error(result.error.errors[0].message);
      return;
    }
    setErrors({});
    await onSave(result.data);
    setForm(FORM_VAZIO);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Orçamento</DialogTitle>
          <DialogDescription>Crie um novo orçamento para um cliente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Cliente <span className="text-destructive">*</span></Label>
            <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.cliente_id && <p className="text-xs text-destructive mt-1">{errors.cliente_id}</p>}
          </div>
          <div>
            <Label>Descrição</Label>
            <Input
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="mt-1"
              placeholder="Ex: Janela de correr 2 folhas"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor Total</Label>
              <Input
                type="number"
                value={form.valor_total}
                onChange={(e) => setForm({ ...form, valor_total: e.target.value })}
                className="mt-1"
                placeholder="0,00"
              />
            </div>
            <div>
              <Label>Validade</Label>
              <Input
                type="date"
                value={form.validade}
                onChange={(e) => setForm({ ...form, validade: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? 'Salvando...' : 'Criar orçamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
