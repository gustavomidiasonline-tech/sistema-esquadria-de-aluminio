/**
 * OrcamentoService — Lógica de negócio centralizada
 * Extract de Orcamentos.tsx (Story 7.1-7.2)
 *
 * Responsabilidades:
 * - Cálculo de totais
 * - Operações CRUD de itens
 * - Validações de orçamento
 * - Geração de OP (Ordem de Produção)
 */

import { supabase } from '@/integrations/supabase/client';
import type { ConfiguredItem } from '@/components/orcamentos/ItemConfigurator';

export interface OrcamentoItem {
  id?: string;
  orcamento_id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  largura?: number | null;
  altura?: number | null;
  produto_id?: string | null;
}

export interface Orcamento {
  id: string;
  cliente_id: string;
  descricao?: string;
  valor_total: number;
  status: string;
  validade?: string;
  observacoes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export const OrcamentoService = {
  /**
   * Recalcular total de um orçamento baseado em seus itens
   */
  async recalcularTotal(orcId: string, itens: OrcamentoItem[], excludeId?: string, addValue = 0): Promise<number> {
    const total = itens
      .filter((i) => i.orcamento_id === orcId && i.id !== excludeId)
      .reduce((sum, i) => sum + i.valor_total, addValue);

    await supabase.from('orcamentos').update({ valor_total: total }).eq('id', orcId);
    return total;
  },

  /**
   * Adicionar item ao orçamento
   */
  async adicionarItem(orcId: string, itemData: Omit<OrcamentoItem, 'id' | 'orcamento_id'>): Promise<OrcamentoItem> {
    const item: OrcamentoItem = {
      ...itemData,
      orcamento_id: orcId,
    };

    const { data, error } = await supabase
      .from('orcamento_itens')
      .insert(item as Record<string, unknown>)
      .select()
      .single();

    if (error) throw new Error(`Erro ao adicionar item: ${error.message}`);
    if (!data) throw new Error('Item não foi criado');

    // Recalcular total
    await this.recalcularTotal(orcId, [item], undefined, item.valor_total);

    return data;
  },

  /**
   * Deletar item do orçamento
   */
  async deletarItem(itemId: string, orcId: string, itemValue: number): Promise<void> {
    const { error } = await supabase.from('orcamento_itens').delete().eq('id', itemId);

    if (error) throw new Error(`Erro ao deletar item: ${error.message}`);

    // Recalcular (subtrair valor)
    await this.recalcularTotal(orcId, [], itemId, -itemValue);
  },

  /**
   * Adicionar item calculado (do ItemConfigurator)
   */
  async adicionarItemCalculado(orcId: string, item: ConfiguredItem): Promise<void> {
    const { error } = await supabase
      .from('orcamento_itens')
      .insert({
        orcamento_id: orcId,
        ...item,
      } as Record<string, unknown>);

    if (error) throw new Error(`Erro ao adicionar item calculado: ${error.message}`);

    // Recalcular
    await this.recalcularTotal(orcId, [item as Record<string, unknown>], undefined, item.valor_total);
  },

  /**
   * Validar item obrigatório
   */
  validateItemForm(descricao?: string, valorUnitario?: string): { valid: boolean; error?: string } {
    if (!descricao?.trim()) {
      return { valid: false, error: 'Descrição é obrigatória' };
    }
    if (!valorUnitario || isNaN(Number(valorUnitario))) {
      return { valid: false, error: 'Valor unitário é obrigatório' };
    }
    return { valid: true };
  },

  /**
   * Gerar Ordem de Produção (OP) a partir de orçamento
   */
  async gerarOP(orcId: string, companyId: string): Promise<string> {
    // Buscar orçamento
    const { data: orc, error: orcError } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', orcId)
      .single();

    if (orcError) throw new Error(`Orçamento não encontrado: ${orcError.message}`);
    if (!orc) throw new Error('Orçamento não encontrado');

    // Buscar itens
    const { data: itens, error: itensError } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', orcId);

    if (itensError) throw new Error(`Erro ao buscar itens: ${itensError.message}`);

    // Criar Ordem de Produção
    const { data: op, error: opError } = await supabase
      .from('pedidos')
      .insert({
        company_id: companyId,
        cliente_id: orc.cliente_id,
        descricao: `OP de ${orc.descricao || 'Orçamento'}`,
        status: 'planejamento',
        valor_total: orc.valor_total,
        origem_orcamento_id: orcId,
      } as Record<string, unknown>)
      .select()
      .single();

    if (opError) throw new Error(`Erro ao gerar OP: ${opError.message}`);
    if (!op) throw new Error('OP não foi criada');

    // Copiar itens para a OP
    if (itens && itens.length > 0) {
      const opItens = itens.map((item: any) => ({
        pedido_id: op.id,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        largura: item.largura,
        altura: item.altura,
        produto_id: item.produto_id,
      }));

      const { error: itemsError } = await supabase.from('pedido_itens').insert(opItens as Record<string, unknown>);

      if (itemsError) {
        // Rollback: deletar OP criada
        await supabase.from('pedidos').delete().eq('id', op.id);
        throw new Error(`Erro ao copiar itens: ${itemsError.message}`);
      }
    }

    // Atualizar status do orçamento
    await supabase
      .from('orcamentos')
      .update({ status: 'convertido_em_op' })
      .eq('id', orcId);

    return op.id;
  },

  /**
   * Atualizar status do orçamento
   */
  async atualizarStatus(orcId: string, novoStatus: string): Promise<void> {
    const { error } = await supabase
      .from('orcamentos')
      .update({ status: novoStatus })
      .eq('id', orcId);

    if (error) throw new Error(`Erro ao atualizar status: ${error.message}`);
  },
};
