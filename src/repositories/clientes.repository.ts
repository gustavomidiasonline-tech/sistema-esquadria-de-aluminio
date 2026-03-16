/**
 * ClientesRepository — Acesso a dados de clientes via Supabase
 */
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Cliente = Tables<'clientes'>;
export type ClienteInsert = TablesInsert<'clientes'>;
export type ClienteUpdate = TablesUpdate<'clientes'>;

export const ClientesRepository = {
  async findAll(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome');

    if (error) throw new Error(`Erro ao buscar clientes: ${error.message}`);
    return data ?? [];
  },

  async findById(id: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar cliente ${id}: ${error.message}`);
    }
    return data;
  },

  async findByNome(nome: string): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .ilike('nome', `%${nome}%`)
      .order('nome');

    if (error) throw new Error(`Erro ao buscar clientes por nome: ${error.message}`);
    return data ?? [];
  },

  async create(cliente: ClienteInsert): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .insert(cliente)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar cliente: ${error.message}`);
    if (!data) throw new Error('Cliente criado mas dados não retornados');
    return data;
  },

  async update(id: string, updates: ClienteUpdate): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar cliente ${id}: ${error.message}`);
    if (!data) throw new Error(`Cliente ${id} não encontrado após atualização`);
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw new Error(`Erro ao excluir cliente ${id}: ${error.message}`);
  },
};
