import { AppLayout } from '@/components/AppLayout';
import { Plus } from 'lucide-react';
import { exportOrcamentoPDF } from '@/lib/pdf-export';
import { Button } from '@/components/ui/button';
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate } from '@/hooks/useSupabaseQuery';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { ItemConfigurator, type ConfiguredItem } from '@/components/orcamentos/ItemConfigurator';
import { OrcamentoStats } from '@/components/orcamentos/OrcamentoStats';
import { OrcamentoListView } from '@/components/orcamentos/OrcamentoListView';
import { OrcamentoFormDialog } from '@/components/orcamentos/OrcamentoFormDialog';
import { OrcamentoItemDialog } from '@/components/orcamentos/OrcamentoItemDialog';
import { useOrcamentoState } from '@/hooks/useOrcamentoState';
import { PipelineService } from '@/services/pipeline.service';

const Orcamentos = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: orcamentos = [], isLoading } = useSupabaseQuery('orcamentos', {
    select: '*, clientes(nome, telefone, email, cidade, estado)',
    orderBy: { column: 'created_at', ascending: false },
  });
  const { data: allItens = [] } = useSupabaseQuery('orcamento_itens');
  const { data: clientes = [] } = useSupabaseQuery('clientes');
  const { data: produtos = [] } = useSupabaseQuery('produtos');
  const insertMutation = useSupabaseInsert('orcamentos');
  const updateMutation = useSupabaseUpdate('orcamentos');

  const {
    dialogOpen, setDialogOpen,
    configDialogOpen, setConfigDialogOpen, configOrcId,
    itemDialogOpen, itemOrcId, itemForm, setItemForm,
    openSmartAdd, openAddItem, closeAddItem,
  } = useOrcamentoState();

  const itens = allItens as Record<string, unknown>[];

  const recalcTotal = async (orcId: string, excludeId?: string, add = 0) => {
    const total = itens.filter((i) => i.orcamento_id === orcId && i.id !== excludeId).reduce((s, i) => s + Number(i.valor_total), add);
    await supabase.from('orcamentos').update({ valor_total: total }).eq('id', orcId);
  };
  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ['orcamento_itens'] }); queryClient.invalidateQueries({ queryKey: ['orcamentos'] }); };

  type SaveValues = { cliente_id: string; descricao?: string; valor_total?: string; validade?: string; observacoes?: string };
  const handleSave = async (v: SaveValues) => {
    try { await insertMutation.mutateAsync({ cliente_id: v.cliente_id, descricao: v.descricao, valor_total: Number(v.valor_total) || 0, validade: v.validade || null, observacoes: v.observacoes, created_by: user?.id }); toast.success('Orçamento criado!'); setDialogOpen(false); } catch { /* mutation onError handles toast */ }
  };
  const handleStatusChange = async (id: string, status: string) => {
    try { await updateMutation.mutateAsync({ id, values: { status } }); toast.success('Status atualizado!'); } catch { /* mutation onError handles toast */ }
  };

  const handleAddItem = async () => {
    if (!itemForm.descricao || !itemForm.valor_unitario) { toast.error('Preencha descrição e valor'); return; }
    const qty = Number(itemForm.quantidade) || 1;
    const unit = Number(itemForm.valor_unitario) || 0;
    try {
      const { error } = await supabase.from('orcamento_itens').insert({
        orcamento_id: itemOrcId, descricao: itemForm.descricao, quantidade: qty,
        valor_unitario: unit, valor_total: qty * unit,
        largura: Number(itemForm.largura) || null, altura: Number(itemForm.altura) || null,
        produto_id: itemForm.produto_id || null,
      });
      if (error) throw error;
      await recalcTotal(itemOrcId, undefined, qty * unit);
      invalidate(); toast.success('Item adicionado!'); closeAddItem();
    } catch (e: unknown) { toast.error('Erro: ' + (e instanceof Error ? e.message : String(e))); }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const item = itens.find((i) => i.id === itemId);
      const { error } = await supabase.from('orcamento_itens').delete().eq('id', itemId);
      if (error) throw error;
      if (item) await recalcTotal(item.orcamento_id as string, itemId);
      invalidate(); toast.success('Item removido!');
    } catch (e: unknown) { toast.error('Erro: ' + (e instanceof Error ? e.message : String(e))); }
  };

  const handleExportPDF = (orc: Record<string, unknown>) => {
    exportOrcamentoPDF(orc, itens.filter((i) => i.orcamento_id === orc.id));
    toast.success('PDF gerado com sucesso!');
  };

  const handleSmartAdd = async (item: ConfiguredItem) => {
    if (!configOrcId) return;
    try {
      const { error } = await supabase.from('orcamento_itens').insert({ orcamento_id: configOrcId, ...item } as never);
      if (error) throw error;
      await recalcTotal(configOrcId, undefined, item.valor_total);
      invalidate(); toast.success('Item calculado e adicionado ao orçamento!');
      setConfigDialogOpen(false);
    } catch (e: unknown) { toast.error('Erro: ' + (e instanceof Error ? e.message : String(e))); }
  };

  const handleGerarOP = async (orcId: string) => {
    const companyId = profile?.company_id;
    if (!companyId) { toast.error('Empresa não encontrada'); return; }
    try {
      await PipelineService.triggerForOrcamento(orcId, companyId);
      toast.success('Pipeline iniciado! Plano de corte e OP sendo gerados...');
    } catch (e: unknown) { toast.error('Erro ao gerar OP: ' + (e instanceof Error ? e.message : String(e))); }
  };

  const handleConverterPedido = async (orc: Record<string, unknown>) => {
    try {
      const { error } = await supabase.from('pedidos').insert({
        cliente_id: orc.cliente_id, orcamento_id: orc.id,
        valor_total: Number(orc.valor_total) || 0,
        observacoes: `Convertido do orçamento ORC-${String(orc.numero).padStart(3, '0')}`,
        created_by: user?.id,
      });
      if (error) throw error;
      await handleStatusChange(orc.id as string, 'aprovado');
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success('Orçamento convertido em pedido com sucesso!');
    } catch (e: unknown) { toast.error('Erro: ' + (e instanceof Error ? e.message : String(e))); }
  };

  return (
    <AppLayout>
      <div className="space-y-4 max-w-7xl w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Orçamentos</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{(orcamentos as unknown[]).length} orçamentos</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Novo orçamento
          </Button>
        </div>
        <OrcamentoStats orcamentos={orcamentos as Record<string, unknown>[]} />
        <OrcamentoListView
          orcamentos={orcamentos as Record<string, unknown>[]} allItens={itens} isLoading={isLoading}
          onStatusChange={handleStatusChange} onExportPDF={handleExportPDF}
          onConverterPedido={handleConverterPedido} onAddItem={openAddItem}
          onSmartAdd={openSmartAdd} onDeleteItem={handleDeleteItem}
          onGerarOP={handleGerarOP}
        />
      </div>
      <OrcamentoFormDialog
        open={dialogOpen} onOpenChange={setDialogOpen}
        clientes={clientes as { id: string; nome: string }[]}
        isPending={insertMutation.isPending} onSave={handleSave}
      />
      <OrcamentoItemDialog
        open={itemDialogOpen} onClose={closeAddItem}
        form={itemForm} onChange={setItemForm}
        produtos={produtos as Parameters<typeof OrcamentoItemDialog>[0]['produtos']}
        onSubmit={handleAddItem}
      />
      <ItemConfigurator open={configDialogOpen} onOpenChange={setConfigDialogOpen} onConfirm={handleSmartAdd} />
    </AppLayout>
  );
};

export default Orcamentos;
