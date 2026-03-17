/**
 * OrcamentoRepository — Data Access Layer
 * Story 7.4: Abstração de Acesso a Dados
 *
 * Centraliza todas as queries Supabase para Orcamentos
 * Facilita testes unitários com mock
 */

import { supabase } from '@/integrations/supabase/client';
import type { Orcamento } from '@/hooks/useOrcamentos';
import type { OrcamentoItem } from '@/hooks/useOrcamentoItens';

export const OrcamentoRepository = {
  /**
   * Listar todos os orçamentos
   */
  async listar(): Promise<Orcamento[]> {
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*, clientes(nome, telefone, email, cidade, estado)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Buscar orçamento por ID
   */
  async obterPorId(id: string): Promise<Orcamento | null> {
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*, clientes(*), orcamento_itens(*)')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data || null;
  },

  /**
   * Criar novo orçamento
   */
  async criar(orcamento: Omit<Orcamento, 'id' | 'created_at' | 'updated_at'>): Promise<Orcamento> {
    const { data, error } = await supabase
      .from('orcamentos')
      .insert(orcamento as Record<string, unknown>)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Orçamento não foi criado');
    return data;
  },

  /**
   * Atualizar orçamento
   */
  async atualizar(id: string, updates: Partial<Orcamento>): Promise<Orcamento> {
    const { data, error } = await supabase
      .from('orcamentos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Orçamento não encontrado');
    return data;
  },

  /**
   * Deletar orçamento
   */
  async deletar(id: string): Promise<void> {
    const { error } = await supabase.from('orcamentos').delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * Listar itens de um orçamento
   */
  async listarItens(orcId: string): Promise<OrcamentoItem[]> {
    const { data, error } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', orcId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Adicionar item
   */
  async adicionarItem(item: Omit<OrcamentoItem, 'id' | 'created_at'>): Promise<OrcamentoItem> {
    const { data, error } = await supabase
      .from('orcamento_itens')
      .insert(item as Record<string, unknown>)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Item não foi criado');
    return data;
  },

  /**
   * Atualizar item
   */
  async atualizarItem(id: string, updates: Partial<OrcamentoItem>): Promise<OrcamentoItem> {
    const { data, error } = await supabase
      .from('orcamento_itens')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Item não encontrado');
    return data;
  },

  /**
   * Deletar item
   */
  async deletarItem(id: string): Promise<void> {
    const { error } = await supabase.from('orcamento_itens').delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * Calcular total de itens
   */
  async calcularTotal(orcId: string): Promise<number> {
    const { data, error } = await supabase
      .from('orcamento_itens')
      .select('valor_total')
      .eq('orcamento_id', orcId);

    if (error) throw error;
    return (data || []).reduce((sum: number, item: any) => sum + item.valor_total, 0);
  },
};
