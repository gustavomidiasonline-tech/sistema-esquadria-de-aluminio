import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DataTable } from '@/components/tables/DataTable';
import type { ColumnDef } from '@/components/tables/DataTable';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Phone, Mail, MapPin, Search } from 'lucide-react';

type Fornecedor = {
  id: string;
  nome: string;
  razao_social: string | null;
  cpf_cnpj: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  contato: string | null;
  categoria: string | null;
  observacoes: string | null;
  ativo: boolean;
};

const FORM_VAZIO = {
  nome: '', razao_social: '', cpf_cnpj: '', email: '', telefone: '',
  endereco: '', cidade: '', estado: '', cep: '', contato: '', categoria: '', observacoes: '',
};

const COLUMNS: ColumnDef<Fornecedor>[] = [
  {
    key: 'nome',
    header: 'Nome',
    render: (f) => (
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{f.nome}</span>
          {f.categoria && <Badge variant="outline" className="text-[10px]">{f.categoria}</Badge>}
          {!f.ativo && <Badge variant="destructive" className="text-[10px]">Inativo</Badge>}
        </div>
        {f.razao_social && <p className="text-xs text-muted-foreground mt-0.5">{f.razao_social}</p>}
      </div>
    ),
  },
  {
    key: 'cpf_cnpj',
    header: 'CPF/CNPJ',
    render: (f) => <span className="text-muted-foreground">{f.cpf_cnpj ?? '—'}</span>,
  },
  {
    key: 'contato',
    header: 'Contato',
    render: (f) => (
      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        {f.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{f.telefone}</span>}
        {f.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{f.email}</span>}
      </div>
    ),
  },
  {
    key: 'cidade',
    header: 'Localização',
    render: (f) =>
      f.cidade ? (
        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          <MapPin className="h-3 w-3" />
          {f.cidade}{f.estado ? `/${f.estado}` : ''}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
];

export default function Fornecedores() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Fornecedor | null>(null);
  const [form, setForm] = useState(FORM_VAZIO);

  const { data: fornecedores = [], isLoading } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fornecedores').select('*').order('nome');
      if (error) throw error;
      return data as Fornecedor[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: typeof FORM_VAZIO & { id?: string }) => {
      const payload = {
        nome: formData.nome,
        razao_social: formData.razao_social || null,
        cpf_cnpj: formData.cpf_cnpj || null,
        email: formData.email || null,
        telefone: formData.telefone || null,
        endereco: formData.endereco || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        cep: formData.cep || null,
        contato: formData.contato || null,
        categoria: formData.categoria || null,
        observacoes: formData.observacoes || null,
        created_by: user?.id ?? null,
      };
      if (formData.id) {
        const { error } = await supabase.from('fornecedores').update(payload).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('fornecedores').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success(editing ? 'Fornecedor atualizado!' : 'Fornecedor cadastrado!');
      closeDialog();
    },
    onError: () => toast.error('Erro ao salvar fornecedor'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fornecedores').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor excluído!');
    },
    onError: () => toast.error('Erro ao excluir'),
  });

  function openNew() {
    setForm(FORM_VAZIO);
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(f: Fornecedor) {
    setForm({
      nome: f.nome, razao_social: f.razao_social ?? '', cpf_cnpj: f.cpf_cnpj ?? '',
      email: f.email ?? '', telefone: f.telefone ?? '', endereco: f.endereco ?? '',
      cidade: f.cidade ?? '', estado: f.estado ?? '', cep: f.cep ?? '',
      contato: f.contato ?? '', categoria: f.categoria ?? '', observacoes: f.observacoes ?? '',
    });
    setEditing(f);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setForm(FORM_VAZIO);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome) { toast.error('Nome é obrigatório'); return; }
    saveMutation.mutate({ ...form, id: editing?.id });
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
            <p className="text-sm text-muted-foreground">{fornecedores.length} fornecedores cadastrados</p>
          </div>
          <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Fornecedor</Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <DataTable<Fornecedor>
          data={fornecedores}
          columns={COLUMNS}
          searchable={['nome', 'cpf_cnpj', 'categoria', 'email']}
          searchValue={search}
          isLoading={isLoading}
          emptyMessage="Nenhum fornecedor encontrado."
          renderActions={(f) => (
            <>
              <Button variant="ghost" size="icon" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(f.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </>
          )}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
            <DialogDescription>Preencha os dados do fornecedor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Nome / Nome Fantasia *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Razão Social</Label>
                <Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
              </div>
              <div>
                <Label>CPF / CNPJ</Label>
                <Input value={form.cpf_cnpj} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })} />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ex: Alumínio, Vidro..." />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </div>
              <div>
                <Label>Contato (Pessoa)</Label>
                <Input value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} />
              </div>
              <div>
                <Label>CEP</Label>
                <Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Endereço</Label>
                <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
              </div>
              <div>
                <Label>Estado</Label>
                <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} placeholder="SP" maxLength={2} />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
