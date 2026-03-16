/**
 * ProdutosRepository — Acesso a dados de produtos e perfis via Supabase
 */
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Produto = Tables<'produtos'>;
export type ProdutoInsert = TablesInsert<'produtos'>;
export type ProdutoUpdate = TablesUpdate<'produtos'>;
export type PerfilAluminio = Tables<'perfis_aluminio'>;

export const ProdutosRepository = {
  async findAll(): Promise<Produto[]> {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('nome');

    if (error) throw new Error(`Erro ao buscar produtos: ${error.message}`);
    return data ?? [];
  },

  async findById(id: string): Promise<Produto | null> {
    const { data, error } = await supabase
      .from('produtos')
      .select('*, perfis_aluminio(*)')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar produto ${id}: ${error.message}`);
    }
    return data;
  },

  async findByTipo(tipo: string): Promise<Produto[]> {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('tipo', tipo)
      .order('nome');

    if (error) throw new Error(`Erro ao buscar produtos por tipo: ${error.message}`);
    return data ?? [];
  },

  async findPerfisAluminio(produtoId: string): Promise<PerfilAluminio[]> {
    const { data, error } = await supabase
      .from('perfis_aluminio')
      .select('*')
      .eq('produto_id', produtoId)
      .order('posicao');

    if (error) throw new Error(`Erro ao buscar perfis do produto ${produtoId}: ${error.message}`);
    return data ?? [];
  },

  async create(produto: ProdutoInsert): Promise<Produto> {
    const { data, error } = await supabase
      .from('produtos')
      .insert(produto)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar produto: ${error.message}`);
    if (!data) throw new Error('Produto criado mas dados não retornados');
    return data;
  },

  async update(id: string, updates: ProdutoUpdate): Promise<Produto> {
    const { data, error } = await supabase
      .from('produtos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar produto ${id}: ${error.message}`);
    if (!data) throw new Error(`Produto ${id} não encontrado após atualização`);
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) throw new Error(`Erro ao excluir produto ${id}: ${error.message}`);
  },
};
