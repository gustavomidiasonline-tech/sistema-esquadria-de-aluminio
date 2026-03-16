/**
 * OrcamentosRepository — Acesso a dados de orçamentos via Supabase
 */
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Orcamento = Tables<'orcamentos'>;
export type OrcamentoInsert = TablesInsert<'orcamentos'>;
export type OrcamentoUpdate = TablesUpdate<'orcamentos'>;
export type OrcamentoItem = Tables<'orcamento_itens'>;
export type OrcamentoItemInsert = TablesInsert<'orcamento_itens'>;

export const OrcamentosRepository = {
  async findAll(): Promise<Orcamento[]> {
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*, clientes(nome)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Erro ao buscar orçamentos: ${error.message}`);
    return data ?? [];
  },

  async findById(id: string): Promise<Orcamento & { orcamento_itens: OrcamentoItem[] } | null> {
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*, orcamento_itens(*), clientes(nome, email, telefone)')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar orçamento ${id}: ${error.message}`);
    }
    return data as unknown as Orcamento & { orcamento_itens: OrcamentoItem[] };
  },

  async findByCliente(clienteId: string): Promise<Orcamento[]> {
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Erro ao buscar orçamentos do cliente: ${error.message}`);
    return data ?? [];
  },

  async findByStatus(status: string): Promise<Orcamento[]> {
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*, clientes(nome)')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Erro ao buscar orçamentos por status: ${error.message}`);
    return data ?? [];
  },

  async create(orcamento: OrcamentoInsert): Promise<Orcamento> {
    const { data, error } = await supabase
      .from('orcamentos')
      .insert(orcamento)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar orçamento: ${error.message}`);
    if (!data) throw new Error('Orçamento criado mas dados não retornados');
    return data;
  },

  async update(id: string, updates: OrcamentoUpdate): Promise<Orcamento> {
    const { data, error } = await supabase
      .from('orcamentos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar orçamento ${id}: ${error.message}`);
    if (!data) throw new Error(`Orçamento ${id} não encontrado após atualização`);
    return data;
  },

  async updateStatus(id: string, status: string): Promise<Orcamento> {
    return OrcamentosRepository.update(id, { status } as OrcamentoUpdate);
  },

  async addItem(item: OrcamentoItemInsert): Promise<OrcamentoItem> {
    const { data, error } = await supabase
      .from('orcamento_itens')
      .insert(item)
      .select()
      .single();

    if (error) throw new Error(`Erro ao adicionar item ao orçamento: ${error.message}`);
    if (!data) throw new Error('Item criado mas dados não retornados');
    return data;
  },

  async removeItem(itemId: string): Promise<void> {
    const { error } = await supabase.from('orcamento_itens').delete().eq('id', itemId);
    if (error) throw new Error(`Erro ao remover item do orçamento: ${error.message}`);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('orcamentos').delete().eq('id', id);
    if (error) throw new Error(`Erro ao excluir orçamento ${id}: ${error.message}`);
  },
};
