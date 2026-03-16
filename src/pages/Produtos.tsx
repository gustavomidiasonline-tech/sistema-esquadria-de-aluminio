import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Package, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useProdutos } from '@/hooks/useProdutos';
import { useSupabaseDelete, useSupabaseInsert, useSupabaseUpdate } from '@/hooks/useSupabaseQuery';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Produto = Tables<'produtos'>;

type ProdutoFormState = {
  nome: string;
  tipo: string;
  preco: string;
  descricao: string;
  ativo: boolean;
  largura_padrao: string;
  altura_padrao: string;
  folhas: string;
};

const FORM_DEFAULT: ProdutoFormState = {
  nome: '',
  tipo: '',
  preco: '',
  descricao: '',
  ativo: true,
  largura_padrao: '',
  altura_padrao: '',
  folhas: '',
};

const formatCurrency = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const Produtos = () => {
  const { data: produtos = [], isLoading } = useProdutos();
  const insertMutation = useSupabaseInsert('produtos');
  const updateMutation = useSupabaseUpdate('produtos');
  const deleteMutation = useSupabaseDelete('produtos');

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [form, setForm] = useState<ProdutoFormState>(FORM_DEFAULT);
  const [deleteTarget, setDeleteTarget] = useState<Produto | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return produtos;
    return produtos.filter((p) =>
      p.nome.toLowerCase().includes(term) || p.tipo.toLowerCase().includes(term),
    );
  }, [produtos, search]);

  const openNew = () => {
    setEditing(null);
    setForm(FORM_DEFAULT);
    setDialogOpen(true);
  };

  const openEdit = (produto: Produto) => {
    setEditing(produto);
    setForm({
      nome: produto.nome ?? '',
      tipo: produto.tipo ?? '',
      preco: produto.preco != null ? String(produto.preco) : '',
      descricao: produto.descricao ?? '',
      ativo: produto.ativo ?? true,
      largura_padrao: produto.largura_padrao != null ? String(produto.largura_padrao) : '',
      altura_padrao: produto.altura_padrao != null ? String(produto.altura_padrao) : '',
      folhas: produto.folhas != null ? String(produto.folhas) : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error('Nome do produto é obrigatório.');
      return;
    }
    if (!form.tipo.trim()) {
      toast.error('Tipo do produto é obrigatório.');
      return;
    }

    const payload = {
      nome: form.nome.trim(),
      tipo: form.tipo.trim(),
      preco: form.preco ? Number(form.preco) : null,
      descricao: form.descricao.trim() || null,
      ativo: form.ativo,
      largura_padrao: form.largura_padrao ? Number(form.largura_padrao) : null,
      altura_padrao: form.altura_padrao ? Number(form.altura_padrao) : null,
      folhas: form.folhas ? Number(form.folhas) : null,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, values: payload });
        toast.success('Produto atualizado!');
      } else {
        await insertMutation.mutateAsync(payload);
        toast.success('Produto criado!');
      }
      setDialogOpen(false);
      setEditing(null);
      setForm(FORM_DEFAULT);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar produto';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Produto excluído!');
      setDeleteTarget(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir produto';
      toast.error(message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
            <p className="text-sm text-muted-foreground">{produtos.length} produtos cadastrados</p>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Novo produto
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-3">Nenhum produto cadastrado</p>
            <Button onClick={openNew} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Criar primeiro produto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((product) => (
              <div key={product.id} className="glass-card-premium p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{product.nome}</p>
                      <p className="text-xs text-muted-foreground">{product.tipo}</p>
                    </div>
                  </div>
                  <span className={`glass-badge-neon text-[10px] ${product.ativo ? '' : 'opacity-70'}`}>
                    {product.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-lg font-bold text-foreground">{formatCurrency(product.preco)}</p>
                  <div className="text-xs text-muted-foreground">
                    {product.largura_padrao || product.altura_padrao ? (
                      <span>
                        Padrão: {product.largura_padrao ?? '—'} x {product.altura_padrao ?? '—'} mm
                      </span>
                    ) : (
                      <span>Dimensões padrão não definidas</span>
                    )}
                  </div>
                  {product.folhas != null && (
                    <div className="text-xs text-muted-foreground">Folhas: {product.folhas}</div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(product)} aria-label="Editar produto">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(product)}
                    aria-label="Excluir produto"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription>
              Cadastre os detalhes do produto. Campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Input value={form.tipo} onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preço</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.preco}
                  onChange={(e) => setForm((s) => ({ ...s, preco: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Folhas</Label>
                <Input
                  type="number"
                  value={form.folhas}
                  onChange={(e) => setForm((s) => ({ ...s, folhas: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Largura padrão (mm)</Label>
                <Input
                  type="number"
                  value={form.largura_padrao}
                  onChange={(e) => setForm((s) => ({ ...s, largura_padrao: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Altura padrão (mm)</Label>
                <Input
                  type="number"
                  value={form.altura_padrao}
                  onChange={(e) => setForm((s) => ({ ...s, altura_padrao: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Produto ativo</p>
                <p className="text-xs text-muted-foreground">Inativos não aparecem nas seleções padrão</p>
              </div>
              <Switch checked={form.ativo} onCheckedChange={(checked) => setForm((s) => ({ ...s, ativo: checked }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={insertMutation.isPending || updateMutation.isPending}>
              {editing ? 'Salvar alterações' : 'Criar produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O produto será removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Produtos;
