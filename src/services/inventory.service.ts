/**
 * InventoryService — Gestão de estoque para o pipeline de produção
 * Controla itens, reservas e alertas de estoque mínimo
 */

import { supabase } from '@/integrations/supabase/client';

export type InventoryItemTipo = 'perfil' | 'vidro' | 'ferragem' | 'acessorio' | 'outro';

export interface InventoryItem {
  id: string;
  company_id: string;
  codigo: string;
  nome: string;
  tipo: InventoryItemTipo;
  quantidade_disponivel: number;
  quantidade_reservada: number;
  quantidade_minima: number;
  unidade: string;
  localizacao?: string;
}

export interface InventoryMovement {
  item_id: string;
  tipo: 'entrada' | 'saida' | 'reserva' | 'liberacao';
  quantidade: number;
  referencia?: string;  // cutting_plan_id, purchase_order_id, etc.
}

export interface StockAlert {
  itemId: string;
  codigo: string;
  nome: string;
  disponivel: number;
  minimo: number;
  deficit: number;
}

export const InventoryService = {
  /**
   * Lista todos os itens de estoque da empresa
   */
  async listarItens(companyId: string, tipo?: InventoryItemTipo): Promise<InventoryItem[]> {
    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('company_id', companyId)
      .order('tipo', { ascending: true })
      .order('nome', { ascending: true });

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Erro ao listar estoque: ${error.message}`);
    return (data ?? []) as InventoryItem[];
  },

  /**
   * Busca item por código
   */
  async buscarPorCodigo(companyId: string, codigo: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('company_id', companyId)
      .eq('codigo', codigo)
      .single();

    if (error?.code === 'PGRST116') return null;
    if (error) throw new Error(`Erro ao buscar item: ${error.message}`);
    return data as InventoryItem;
  },

  /**
   * Cria ou atualiza um item de estoque (upsert por codigo+company_id)
   */
  async salvarItem(
    companyId: string,
    item: Omit<InventoryItem, 'id' | 'company_id'>
  ): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .upsert(
        { ...item, company_id: companyId },
        { onConflict: 'company_id,codigo' }
      )
      .select()
      .single();

    if (error) throw new Error(`Erro ao salvar item: ${error.message}`);
    return data as InventoryItem;
  },

  /**
   * Atualiza quantidade disponível (entrada ou saída de estoque)
   */
  async atualizarQuantidade(
    companyId: string,
    itemId: string,
    delta: number  // positivo = entrada, negativo = saída
  ): Promise<void> {
    const { data: current, error: fetchError } = await supabase
      .from('inventory_items')
      .select('quantidade_disponivel')
      .eq('id', itemId)
      .eq('company_id', companyId)
      .single();

    if (fetchError) throw new Error(`Item não encontrado: ${fetchError.message}`);

    const novaQtd = Math.max(0, (current.quantidade_disponivel as number) + delta);

    const { error } = await supabase
      .from('inventory_items')
      .update({ quantidade_disponivel: novaQtd })
      .eq('id', itemId)
      .eq('company_id', companyId);

    if (error) throw new Error(`Erro ao atualizar quantidade: ${error.message}`);
  },

  /**
   * Reserva quantidade para uma ordem de produção
   */
  async reservar(companyId: string, itemId: string, quantidade: number): Promise<void> {
    const { data: current, error: fetchError } = await supabase
      .from('inventory_items')
      .select('quantidade_disponivel, quantidade_reservada')
      .eq('id', itemId)
      .eq('company_id', companyId)
      .single();

    if (fetchError) throw new Error(`Item não encontrado: ${fetchError.message}`);

    const disponivel = current.quantidade_disponivel as number;
    if (disponivel < quantidade) {
      throw new Error(`Estoque insuficiente: disponível ${disponivel}, necessário ${quantidade}`);
    }

    const { error } = await supabase
      .from('inventory_items')
      .update({
        quantidade_disponivel: disponivel - quantidade,
        quantidade_reservada: (current.quantidade_reservada as number) + quantidade,
      })
      .eq('id', itemId)
      .eq('company_id', companyId);

    if (error) throw new Error(`Erro ao reservar: ${error.message}`);
  },

  /**
   * Libera reserva de volta para disponível
   */
  async liberarReserva(companyId: string, itemId: string, quantidade: number): Promise<void> {
    const { data: current, error: fetchError } = await supabase
      .from('inventory_items')
      .select('quantidade_disponivel, quantidade_reservada')
      .eq('id', itemId)
      .eq('company_id', companyId)
      .single();

    if (fetchError) throw new Error(`Item não encontrado: ${fetchError.message}`);

    const reservada = current.quantidade_reservada as number;
    const liberando = Math.min(quantidade, reservada);

    const { error } = await supabase
      .from('inventory_items')
      .update({
        quantidade_disponivel: (current.quantidade_disponivel as number) + liberando,
        quantidade_reservada: reservada - liberando,
      })
      .eq('id', itemId)
      .eq('company_id', companyId);

    if (error) throw new Error(`Erro ao liberar reserva: ${error.message}`);
  },

  /**
   * Retorna itens abaixo do estoque mínimo (alertas)
   */
  async getAlertasEstoque(companyId: string): Promise<StockAlert[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id, codigo, nome, quantidade_disponivel, quantidade_minima')
      .eq('company_id', companyId)
      .filter('quantidade_disponivel', 'lt', 'quantidade_minima');

    if (error) throw new Error(`Erro ao buscar alertas: ${error.message}`);

    return (data ?? []).map((item) => ({
      itemId: item.id as string,
      codigo: item.codigo as string,
      nome: item.nome as string,
      disponivel: item.quantidade_disponivel as number,
      minimo: item.quantidade_minima as number,
      deficit: (item.quantidade_minima as number) - (item.quantidade_disponivel as number),
    }));
  },

  /**
   * Importa lista de itens em lote (de um pedido de compra recebido)
   */
  async importarLote(
    companyId: string,
    itens: Array<{ codigo: string; nome: string; tipo: InventoryItemTipo; quantidade: number; unidade: string }>
  ): Promise<void> {
    for (const item of itens) {
      const existing = await InventoryService.buscarPorCodigo(companyId, item.codigo);
      if (existing) {
        await InventoryService.atualizarQuantidade(companyId, existing.id, item.quantidade);
      } else {
        await InventoryService.salvarItem(companyId, {
          codigo: item.codigo,
          nome: item.nome,
          tipo: item.tipo,
          quantidade_disponivel: item.quantidade,
          quantidade_reservada: 0,
          quantidade_minima: 0,
          unidade: item.unidade,
        });
      }
    }
  },
};
