import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryService, type InventoryItem, type InventoryItemTipo } from '@/services/inventory.service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const TIPO_LABELS: Record<InventoryItemTipo, string> = {
  perfil: 'Perfil', vidro: 'Vidro', ferragem: 'Ferragem', acessorio: 'Acessório', outro: 'Outro',
};

export const TIPO_COLORS: Record<InventoryItemTipo, string> = {
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
  codigo: '', nome: '', tipo: 'perfil', quantidade_disponivel: '0',
  quantidade_minima: '0', unidade: 'barra', localizacao: '',
};

export function useEstoque(companyId: string) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<InventoryItemTipo | 'todos'>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<ItemFormValues>(DEFAULT_FORM);
  const [autoSynced, setAutoSynced] = useState(false);

  const { data: itens = [], isLoading, refetch } = useQuery({
    queryKey: ['inventory_items', companyId, tipoFiltro],
    queryFn: () => InventoryService.listarItens(companyId, tipoFiltro === 'todos' ? undefined : tipoFiltro),
    enabled: !!companyId,
  });

  const { data: alertas = [] } = useQuery({
    queryKey: ['inventory_alerts', companyId],
    queryFn: () => InventoryService.getAlertasEstoque(companyId),
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: (values: Omit<InventoryItem, 'id' | 'company_id'>) => InventoryService.salvarItem(companyId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_alerts'] });
      toast.success(editingItem ? 'Item atualizado!' : 'Item criado!');
      closeDialog();
    },
    onError: (err: unknown) => toast.error((err instanceof Error ? err.message : 'Erro ao salvar')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: InventoryItem) => {
      const { error } = await supabase.from('inventory_items').delete().eq('id', item.id).eq('company_id', companyId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_alerts'] });
      toast.success('Item removido');
    },
    onError: (err: unknown) => toast.error((err instanceof Error ? err.message : 'Erro ao remover')),
  });

  const syncMutation = useMutation({
    mutationFn: () => InventoryService.sincronizarMateriaisDeProdutos(companyId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_alerts'] });
      toast.success(`Sincronizado: ${result.inserted} novo(s), ${result.updated} vinculado(s)`);
    },
    onError: (err: unknown) => toast.error((err instanceof Error ? err.message : 'Erro ao sincronizar')),
  });

  useEffect(() => {
    if (!companyId || autoSynced || isLoading) return;
    syncMutation.mutate(undefined, {
      onSettled: () => setAutoSynced(true),
    });
  }, [companyId, autoSynced, isLoading, syncMutation]);

  const itensFiltrados = itens.filter(i => i.nome.toLowerCase().includes(search.toLowerCase()) || i.codigo.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setEditingItem(null); setForm(DEFAULT_FORM); setDialogOpen(true); };
  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({ codigo: item.codigo, nome: item.nome, tipo: item.tipo, quantidade_disponivel: String(item.quantidade_disponivel), quantidade_minima: String(item.quantidade_minima), unidade: item.unidade, localizacao: item.localizacao ?? '' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.codigo.trim() || !form.nome.trim()) { toast.error('Código e nome são obrigatórios'); return; }
    saveMutation.mutate({
      codigo: form.codigo.trim(), nome: form.nome.trim(), tipo: form.tipo,
      quantidade_disponivel: Number(form.quantidade_disponivel) || 0,
      quantidade_reservada: editingItem?.quantidade_reservada ?? 0,
      quantidade_minima: Number(form.quantidade_minima) || 0,
      unidade: form.unidade.trim() || 'un',
      localizacao: form.localizacao.trim() || undefined,
    });
  };

  const closeDialog = () => { setDialogOpen(false); setEditingItem(null); setForm(DEFAULT_FORM); };
  const syncProdutos = () => syncMutation.mutate();

  const totalItens = itens.length;
  const totalAlertas = alertas.length;
  const totalValorEstoque = itens.reduce((sum, i) => sum + i.quantidade_disponivel, 0);

  return {
    search, setSearch, tipoFiltro, setTipoFiltro, dialogOpen, setDialogOpen,
    editingItem, form, setForm, openNew, openEdit, handleSave, closeDialog,
    itens, itensFiltrados, isLoading, refetch,
    alertas, saveMutation, deleteMutation, syncMutation, syncProdutos,
    totalItens, totalAlertas, totalValorEstoque,
  };
}
