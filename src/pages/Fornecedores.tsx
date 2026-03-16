import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, Phone, Mail, MapPin, Search, Globe, User,
  Building2, Star, Package, Users, AlertCircle, CheckCircle2, XCircle,
  Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Fornecedor {
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
  created_at: string;
}

type FornecedorCategoria = 'aluminio' | 'vidro' | 'ferragens' | 'acessorios' | 'perfis' | 'servico' | 'outros';
type FornecedorStatus = 'ativo' | 'inativo';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIAS: { value: FornecedorCategoria; label: string }[] = [
  { value: 'aluminio', label: 'Aluminio' },
  { value: 'vidro', label: 'Vidro' },
  { value: 'ferragens', label: 'Ferragens' },
  { value: 'acessorios', label: 'Acessorios' },
  { value: 'perfis', label: 'Perfis' },
  { value: 'servico', label: 'Servico' },
  { value: 'outros', label: 'Outros' },
];

const CATEGORIA_COLORS: Record<string, string> = {
  aluminio: 'bg-amber-100 text-amber-700 border-amber-200',
  vidro: 'bg-blue-100 text-blue-700 border-blue-200',
  ferragens: 'bg-orange-100 text-orange-700 border-orange-200',
  acessorios: 'bg-purple-100 text-purple-700 border-purple-200',
  perfis: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  servico: 'bg-green-100 text-green-700 border-green-200',
  outros: 'bg-gray-100 text-gray-700 border-gray-200',
};

const STATUS_COLORS: Record<string, string> = {
  ativo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  inativo: 'bg-gray-100 text-gray-600 border-gray-200',
};

const FORM_EMPTY = {
  nome: '',
  razao_social: '',
  cpf_cnpj: '',
  email: '',
  telefone: '',
  contato: '',
  website: '',
  cep: '',
  endereco: '',
  cidade: '',
  estado: '',
  categoria: '' as string,
  status: 'ativo' as FornecedorStatus,
  observacoes: '',
};

// ---------------------------------------------------------------------------
// Star Rating component
// ---------------------------------------------------------------------------

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(i)}
          className={`text-lg transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} ${
            i <= value ? 'text-amber-400' : 'text-muted-foreground/20'
          }`}
        >
          <Star className={`h-4 w-4 ${i <= value ? 'fill-amber-400' : ''}`} />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Fornecedores() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Fornecedor | null>(null);
  const [form, setForm] = useState(FORM_EMPTY);
  const [activeTab, setActiveTab] = useState('empresa');
  const [cepLoading, setCepLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ---- Data fetching ----

  const { data: fornecedores = [], isLoading } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fornecedores').select('*').order('nome');
      if (error) throw error;
      return data as Fornecedor[];
    },
  });

  // ---- Mutations ----

  const saveMutation = useMutation({
    mutationFn: async (formData: typeof FORM_EMPTY & { id?: string }) => {
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
        ativo: formData.status === 'ativo',
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
      toast.success(editing ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor cadastrado com sucesso!');
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
      toast.success('Fornecedor excluido com sucesso!');
      setDeleteConfirmId(null);
    },
    onError: () => toast.error('Erro ao excluir fornecedor'),
  });

  // ---- CEP lookup ----

  const buscarCep = useCallback(async () => {
    const cepClean = form.cep.replace(/\D/g, '');
    if (cepClean.length !== 8) {
      toast.error('CEP deve ter 8 digitos');
      return;
    }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error('CEP nao encontrado');
        return;
      }
      setForm((prev) => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
      toast.success('Endereco preenchido automaticamente!');
    } catch {
      toast.error('Erro ao buscar CEP');
    } finally {
      setCepLoading(false);
    }
  }, [form.cep]);

  // ---- Dialog handlers ----

  function openNew() {
    setForm(FORM_EMPTY);
    setEditing(null);
    setActiveTab('empresa');
    setDialogOpen(true);
  }

  function openEdit(f: Fornecedor) {
    setForm({
      nome: f.nome,
      razao_social: f.razao_social ?? '',
      cpf_cnpj: f.cpf_cnpj ?? '',
      email: f.email ?? '',
      telefone: f.telefone ?? '',
      contato: f.contato ?? '',
      website: '',
      cep: f.cep ?? '',
      endereco: f.endereco ?? '',
      cidade: f.cidade ?? '',
      estado: f.estado ?? '',
      categoria: f.categoria ?? '',
      status: f.ativo ? 'ativo' : 'inativo',
      observacoes: f.observacoes ?? '',
    });
    setEditing(f);
    setActiveTab('empresa');
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setForm(FORM_EMPTY);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error('Nome e obrigatorio');
      return;
    }
    saveMutation.mutate({ ...form, id: editing?.id });
  }

  // ---- Filtering ----

  const filtered = fornecedores.filter((f) => {
    const matchSearch =
      !search ||
      f.nome.toLowerCase().includes(search.toLowerCase()) ||
      (f.cpf_cnpj ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (f.razao_social ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategoria === 'all' || f.categoria === filterCategoria;
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'ativo' && f.ativo) ||
      (filterStatus === 'inativo' && !f.ativo);
    return matchSearch && matchCat && matchStatus;
  });

  // ---- KPIs ----

  const totalFornecedores = fornecedores.length;
  const ativos = fornecedores.filter((f) => f.ativo).length;
  const inativos = fornecedores.filter((f) => !f.ativo).length;

  // ---- Helpers ----

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const getCategoriaBadge = (cat: string | null) => {
    if (!cat) return null;
    const colors = CATEGORIA_COLORS[cat] || CATEGORIA_COLORS.outros;
    const label = CATEGORIAS.find((c) => c.value === cat)?.label || cat;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors}`}>
        {label}
      </span>
    );
  };

  const getStatusBadge = (ativo: boolean) => {
    const key = ativo ? 'ativo' : 'inativo';
    const colors = STATUS_COLORS[key];
    const Icon = ativo ? CheckCircle2 : XCircle;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors}`}>
        <Icon className="h-3 w-3" />
        {ativo ? 'Ativo' : 'Inativo'}
      </span>
    );
  };

  // ---- Render ----

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
            <p className="text-sm text-muted-foreground">Gestao completa de fornecedores e parceiros comerciais</p>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Fornecedor
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalFornecedores}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-muted-foreground">Ativos</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{ativos}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-muted-foreground">Inativos</span>
            </div>
            <p className="text-2xl font-bold text-gray-500">{inativos}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">Categorias</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {new Set(fornecedores.map((f) => f.categoria).filter(Boolean)).size}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ ou razao social..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum fornecedor encontrado.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fornecedor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contato</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Localizacao</th>
                    <th className="px-4 py-3 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((f) => (
                    <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{f.nome}</p>
                          {f.razao_social && (
                            <p className="text-xs text-muted-foreground mt-0.5">{f.razao_social}</p>
                          )}
                          {f.cpf_cnpj && (
                            <p className="text-xs text-muted-foreground font-mono">{f.cpf_cnpj}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{getCategoriaBadge(f.categoria)}</td>
                      <td className="px-4 py-3">{getStatusBadge(f.ativo)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          {f.telefone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {f.telefone}
                            </span>
                          )}
                          {f.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {f.email}
                            </span>
                          )}
                          {f.contato && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {f.contato}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {f.cidade ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {f.cidade}
                            {f.estado ? `/${f.estado}` : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(f)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(f.id)}
                            className="text-destructive hover:text-destructive"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            <div className="border-t border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
              {filtered.length} fornecedor{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirmar exclusao
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este fornecedor? Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit dialog with tabs */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
            <DialogDescription>Preencha os dados do fornecedor nas abas abaixo.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="empresa">Empresa</TabsTrigger>
                <TabsTrigger value="contato">Contato</TabsTrigger>
                <TabsTrigger value="endereco">Endereco</TabsTrigger>
                <TabsTrigger value="observacoes">Notas</TabsTrigger>
              </TabsList>

              {/* Tab: Empresa */}
              <TabsContent value="empresa" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Nome / Nome Fantasia <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Nome do fornecedor"
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Razao Social</Label>
                    <Input
                      value={form.razao_social}
                      onChange={(e) => setForm({ ...form, razao_social: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>CNPJ / CPF</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={form.cpf_cnpj}
                        onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })}
                        placeholder="00.000.000/0001-00"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => toast.info('Consulta CNPJ sera disponibilizada em breve')}
                      >
                        Buscar
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={form.categoria}
                      onValueChange={(v) => setForm({ ...form, categoria: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm({ ...form, status: v as FornecedorStatus })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Contato */}
              <TabsContent value="contato" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={form.telefone}
                      onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="contato@empresa.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Contato Responsavel</Label>
                    <Input
                      value={form.contato}
                      onChange={(e) => setForm({ ...form, contato: e.target.value })}
                      placeholder="Nome do responsavel"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      placeholder="https://www.empresa.com"
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Endereco */}
              <TabsContent value="endereco" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>CEP</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={form.cep}
                        onChange={(e) => setForm({ ...form, cep: e.target.value })}
                        placeholder="00000-000"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1"
                        onClick={buscarCep}
                        disabled={cepLoading}
                      >
                        {cepLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                        Buscar
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label>Endereco</Label>
                    <Input
                      value={form.endereco}
                      onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      value={form.cidade}
                      onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input
                      value={form.estado}
                      onChange={(e) => setForm({ ...form, estado: e.target.value })}
                      placeholder="SP"
                      maxLength={2}
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Observacoes */}
              <TabsContent value="observacoes" className="space-y-4 mt-4">
                <div>
                  <Label>Observacoes</Label>
                  <Textarea
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    rows={5}
                    placeholder="Informacoes adicionais sobre o fornecedor..."
                    className="mt-1"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : editing ? (
                  'Atualizar'
                ) : (
                  'Cadastrar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
