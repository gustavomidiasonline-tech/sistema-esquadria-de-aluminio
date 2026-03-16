/**
 * PedidosRepository — Acesso a dados de pedidos via Supabase
 */
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Pedido = Tables<'pedidos'>;
export type PedidoInsert = TablesInsert<'pedidos'>;
export type PedidoUpdate = TablesUpdate<'pedidos'>;

export const PedidosRepository = {
  async findAll(): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, clientes(nome)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Erro ao buscar pedidos: ${error.message}`);
    return data ?? [];
  },

  async findById(id: string): Promise<Pedido | null> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, clientes(nome, email, telefone), pedido_itens(*)')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar pedido ${id}: ${error.message}`);
    }
    return data;
  },

  async findByStatus(status: string): Promise<Pedido[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, clientes(nome)')
      .eq('status', status)
      .order('data_entrega');

    if (error) throw new Error(`Erro ao buscar pedidos por status: ${error.message}`);
    return data ?? [];
  },

  async findAtrasados(): Promise<Pedido[]> {
    const hoje = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, clientes(nome)')
      .lt('data_entrega', hoje)
      .not('status', 'in', '("entregue","cancelado")')
      .order('data_entrega');

    if (error) throw new Error(`Erro ao buscar pedidos atrasados: ${error.message}`);
    return data ?? [];
  },

  async create(pedido: PedidoInsert): Promise<Pedido> {
    const { data, error } = await supabase
      .from('pedidos')
      .insert(pedido)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar pedido: ${error.message}`);
    if (!data) throw new Error('Pedido criado mas dados não retornados');
    return data;
  },

  async update(id: string, updates: PedidoUpdate): Promise<Pedido> {
    const { data, error } = await supabase
      .from('pedidos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar pedido ${id}: ${error.message}`);
    if (!data) throw new Error(`Pedido ${id} não encontrado após atualização`);
    return data;
  },

  async updateStatus(id: string, status: string): Promise<Pedido> {
    return PedidosRepository.update(id, { status } as PedidoUpdate);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('pedidos').delete().eq('id', id);
    if (error) throw new Error(`Erro ao excluir pedido ${id}: ${error.message}`);
  },

  async fromOrcamento(orcamentoId: string, pedidoData: Partial<PedidoInsert>): Promise<Pedido> {
    const pedido: PedidoInsert = {
      orcamento_id: orcamentoId,
      ...pedidoData,
    } as PedidoInsert;

    return PedidosRepository.create(pedido);
  },
};
