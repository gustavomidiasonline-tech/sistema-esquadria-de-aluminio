import { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const orcamentoSchema = z.object({
  cliente_id: z.string().min(1, 'Selecione ou crie um cliente'),
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
  onCreateCliente: (nome: string) => Promise<string>;
}

const FORM_VAZIO: OrcamentoFormValues = {
  cliente_id: '', descricao: '', valor_total: '', validade: '', observacoes: '',
};

export function OrcamentoFormDialog({ open, onOpenChange, clientes, isPending, onSave, onCreateCliente }: OrcamentoFormDialogProps) {
  const [form, setForm] = useState<OrcamentoFormValues>(FORM_VAZIO);
  const [errors, setErrors] = useState<Partial<Record<keyof OrcamentoFormValues, string>>>({});
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creatingCliente, setCreatingCliente] = useState(false);

  const selectedCliente = clientes.find((c) => c.id === form.cliente_id);

  const handleClose = () => {
    setForm(FORM_VAZIO);
    setErrors({});
    setSearch('');
    setPopoverOpen(false);
    onOpenChange(false);
  };

  const handleSelectCliente = (id: string, nome: string) => {
    setForm({ ...form, cliente_id: id });
    setSearch(nome);
    setPopoverOpen(false);
    setErrors({ ...errors, cliente_id: undefined });
  };

  const handleCreateNew = async () => {
    const nome = search.trim();
    if (!nome) return;
    setCreatingCliente(true);
    try {
      const id = await onCreateCliente(nome);
      handleSelectCliente(id, nome);
      toast.success(`Cliente "${nome}" criado!`);
    } catch {
      toast.error('Erro ao criar cliente');
    } finally {
      setCreatingCliente(false);
    }
  };

  const handleSave = async () => {
    const result = orcamentoSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((e) => {
        const field = e.path[0] as keyof OrcamentoFormValues;
        fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      toast.error(result.error.issues[0].message);
      return;
    }
    setErrors({});
    await onSave(result.data);
    setForm(FORM_VAZIO);
    setSearch('');
  };

  const filteredClientes = clientes.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  );

  const canCreateNew =
    search.trim().length > 0 &&
    !clientes.some((c) => c.nome.toLowerCase() === search.trim().toLowerCase());

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Orçamento</DialogTitle>
          <DialogDescription>Selecione um cliente existente ou crie um novo digitando o nome.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Cliente <span className="text-destructive">*</span></Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className={cn(
                    'w-full justify-between mt-1 font-normal',
                    !selectedCliente && 'text-muted-foreground'
                  )}
                >
                  {selectedCliente ? selectedCliente.nome : 'Selecione ou digite o nome...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar ou criar cliente..."
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList>
                    {filteredClientes.length === 0 && !canCreateNew && (
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    )}
                    {filteredClientes.length > 0 && (
                      <CommandGroup heading="Clientes cadastrados">
                        {filteredClientes.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.id}
                            onSelect={() => handleSelectCliente(c.id, c.nome)}
                          >
                            <Check
                              className={cn('mr-2 h-4 w-4', form.cliente_id === c.id ? 'opacity-100' : 'opacity-0')}
                            />
                            {c.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {canCreateNew && (
                      <CommandGroup heading="Criar novo">
                        <CommandItem onSelect={handleCreateNew} disabled={creatingCliente}>
                          {creatingCliente
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <Plus className="mr-2 h-4 w-4 text-primary" />}
                          <span>
                            Criar <strong>"{search.trim()}"</strong> como novo cliente
                          </span>
                        </CommandItem>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
          <Button onClick={handleSave} disabled={isPending || creatingCliente}>
            {isPending ? 'Salvando...' : 'Criar orçamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
