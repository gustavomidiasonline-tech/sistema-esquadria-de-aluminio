/**
 * Estoque — Gestão de itens de estoque (perfis, vidros, ferragens, acessórios)
 * Integrado com InventoryService + alertas de estoque mínimo
 */

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Plus, AlertTriangle, Package, Search, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryService, type InventoryItem, type InventoryItemTipo } from '@/services/inventory.service';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const TIPO_LABELS: Record<InventoryItemTipo, string> = {
  perfil: 'Perfil',
  vidro: 'Vidro',
  ferragem: 'Ferragem',
  acessorio: 'Acessório',
  outro: 'Outro',
};

const TIPO_COLORS: Record<InventoryItemTipo, string> = {
  perfil: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  vidro: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  ferragem: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  acessorio: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  outro: 'bg-muted text-muted-foreground border-border',
};

interface ItemFormValues {
  codigo: string;
  nome: string;
  tipo: InventoryItemTipo;
  quantidade_disponivel: string;
  quantidade_minima: string;
  unidade: string;
  localizacao: string;
}

const DEFAULT_FORM: ItemFormValues = {
  codigo: '',
  nome: '',
  tipo: 'perfil',
  quantidade_disponivel: '0',
  quantidade_minima: '0',
  unidade: 'barra',
  localizacao: '',
};

export default function Estoque() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? '';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<InventoryItemTipo | 'todos'>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<ItemFormValues>(DEFAULT_FORM);

  const { data: itens = [], isLoading, refetch } = useQuery({
    queryKey: ['inventory_items', companyId, tipoFiltro],
    queryFn: () =>
      InventoryService.listarItens(companyId, tipoFiltro === 'todos' ? undefined : tipoFiltro),
    enabled: !!companyId,
  });

  const { data: alertas = [] } = useQuery({
    queryKey: ['inventory_alerts', companyId],
    queryFn: () => InventoryService.getAlertasEstoque(companyId),
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: (values: Omit<InventoryItem, 'id' | 'company_id'>) =>
      InventoryService.salvarItem(companyId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_alerts'] });
      toast({ title: editingItem ? 'Item atualizado!' : 'Item criado!' });
      setDialogOpen(false);
      setEditingItem(null);
      setForm(DEFAULT_FORM);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: InventoryItem) => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', item.id)
        .eq('company_id', companyId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_alerts'] });
      toast({ title: 'Item removido' });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Erro ao remover';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    },
  });

  const itensFiltrados = itens.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigo.toLowerCase().includes(search.toLowerCase())
  );

  function abrirNovo() {
    setEditingItem(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  }

  function abrirEditar(item: InventoryItem) {
    setEditingItem(item);
    setForm({
      codigo: item.codigo,
      nome: item.nome,
      tipo: item.tipo,
      quantidade_disponivel: String(item.quantidade_disponivel),
      quantidade_minima: String(item.quantidade_minima),
      unidade: item.unidade,
      localizacao: item.localizacao ?? '',
    });
    setDialogOpen(true);
  }

  function handleSalvar() {
    if (!form.codigo.trim() || !form.nome.trim()) {
      toast({ title: 'Código e nome são obrigatórios', variant: 'destructive' });
      return;
    }
    saveMutation.mutate({
      codigo: form.codigo.trim(),
      nome: form.nome.trim(),
      tipo: form.tipo,
      quantidade_disponivel: Number(form.quantidade_disponivel) || 0,
      quantidade_reservada: editingItem?.quantidade_reservada ?? 0,
      quantidade_minima: Number(form.quantidade_minima) || 0,
      unidade: form.unidade.trim() || 'un',
      localizacao: form.localizacao.trim() || undefined,
    });
  }

  const totalItens = itens.length;
  const totalAlertas = alertas.length;
  const totalValorEstoque = itens.reduce((sum, i) => sum + i.quantidade_disponivel, 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
            <p className="text-sm text-muted-foreground">Gerencie perfis, vidros, ferragens e acessórios</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
            <Button onClick={abrirNovo}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Item
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-border rounded-xl p-4 bg-card">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Total de itens</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalItens}</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground font-medium">Unidades em estoque</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalValorEstoque.toLocaleString('pt-BR')}</p>
          </div>
          <div
            className={`border rounded-xl p-4 bg-card ${
              totalAlertas > 0 ? 'border-red-300 bg-red-50' : 'border-border'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`h-4 w-4 ${totalAlertas > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
              <span className="text-xs text-muted-foreground font-medium">Alertas de estoque</span>
            </div>
            <p className={`text-2xl font-bold ${totalAlertas > 0 ? 'text-red-600' : 'text-foreground'}`}>
              {totalAlertas}
            </p>
          </div>
        </div>

        {/* Alertas */}
        {totalAlertas > 0 && (
          <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-semibold">Itens abaixo do estoque mínimo</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {alertas.map((alerta) => (
                <div key={alerta.itemId} className="bg-white border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-foreground">{alerta.nome}</p>
                  <p className="text-[11px] text-muted-foreground">{alerta.codigo}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-red-600 font-medium">
                      {alerta.disponivel}/{alerta.minimo} {alerta.itemId}
                    </span>
                    <span className="text-[10px] text-red-500">faltam {alerta.deficit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={tipoFiltro}
            onValueChange={(v) => setTipoFiltro(v as InventoryItemTipo | 'todos')}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {(Object.keys(TIPO_LABELS) as InventoryItemTipo[]).map((t) => (
                <SelectItem key={t} value={t}>{TIPO_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando estoque...</div>
        ) : itensFiltrados.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum item encontrado</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={abrirNovo}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar primeiro item
            </Button>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Código</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Tipo</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Disponível</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Reservado</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Mínimo</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">Local</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {itensFiltrados.map((item) => {
                  const abaixoMinimo = item.quantidade_disponivel < item.quantidade_minima;
                  return (
                    <tr key={item.id} className={`hover:bg-muted/30 transition-colors ${abaixoMinimo ? 'bg-red-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-primary">{item.codigo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-foreground">{item.nome}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${TIPO_COLORS[item.tipo]}`}>
                          {TIPO_LABELS[item.tipo]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-semibold ${abaixoMinimo ? 'text-red-600' : 'text-foreground'}`}>
                          {item.quantidade_disponivel} {item.unidade}
                        </span>
                        {abaixoMinimo && <AlertTriangle className="h-3 w-3 text-red-500 inline ml-1" />}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-muted-foreground">
                          {item.quantidade_reservada} {item.unidade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-muted-foreground">
                          {item.quantidade_minima} {item.unidade}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-muted-foreground">{item.localizacao ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => abrirEditar(item)}
                            className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(item)}
                            className="h-7 w-7 rounded flex items-center justify-center hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t border-border bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
              {itensFiltrados.length} {itensFiltrados.length === 1 ? 'item' : 'itens'}
            </div>
          </div>
        )}
      </div>

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item de Estoque'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="codigo">Código *</Label>
                <Input id="codigo" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="P-001" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as InventoryItemTipo })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TIPO_LABELS) as InventoryItemTipo[]).map((t) => (
                      <SelectItem key={t} value={t}>{TIPO_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Perfil Marco 40x60mm" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qtd">Qtd. disponível</Label>
                <Input id="qtd" type="number" min="0" value={form.quantidade_disponivel} onChange={(e) => setForm({ ...form, quantidade_disponivel: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="min">Qtd. mínima</Label>
                <Input id="min" type="number" min="0" value={form.quantidade_minima} onChange={(e) => setForm({ ...form, quantidade_minima: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unidade">Unidade</Label>
                <Input id="unidade" value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} placeholder="barra" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="local">Localização</Label>
              <Input id="local" value={form.localizacao} onChange={(e) => setForm({ ...form, localizacao: e.target.value })} placeholder="Prateleira A-3" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSalvar} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : editingItem ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
