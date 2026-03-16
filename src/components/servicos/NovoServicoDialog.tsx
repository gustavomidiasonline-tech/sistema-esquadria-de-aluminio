import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Tables } from '@/integrations/supabase/types';

type Cliente = Tables<'clientes'>;

interface NovoServicoForm {
  cliente_id: string;
  tipo: string;
  descricao: string;
  valor: string;
  data_agendada: string;
  responsavel: string;
}

interface NovoServicoDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: NovoServicoForm;
  onFormChange: (form: NovoServicoForm) => void;
  onSubmit: () => void;
  clientes: Cliente[];
  isPending: boolean;
}

export function NovoServicoDialog({ open, onOpenChange, form, onFormChange, onSubmit, clientes, isPending }: NovoServicoDialogProps) {
  const set = (field: Partial<NovoServicoForm>) => onFormChange({ ...form, ...field });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Serviço</DialogTitle>
          <DialogDescription>Crie um novo serviço vinculado a um cliente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Cliente <span className="text-destructive">*</span></Label>
            <Select value={form.cliente_id} onValueChange={(v) => set({ cliente_id: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => set({ tipo: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instalacao">Instalação</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="reparo">Reparo</SelectItem>
                  <SelectItem value="medicao">Medição</SelectItem>
                  <SelectItem value="entrega">Entrega</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" value={form.valor} onChange={(e) => set({ valor: e.target.value })} className="mt-1" placeholder="0,00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data Agendada</Label>
              <Input type="date" value={form.data_agendada} onChange={(e) => set({ data_agendada: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Responsável</Label>
              <Input value={form.responsavel} onChange={(e) => set({ responsavel: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={(e) => set({ descricao: e.target.value })} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={isPending}>{isPending ? 'Salvando...' : 'Criar serviço'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
