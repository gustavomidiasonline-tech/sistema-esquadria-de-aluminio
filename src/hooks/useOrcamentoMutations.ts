import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Orcamento = Tables<'orcamentos'>;
export type OrcamentoInsert = TablesInsert<'orcamentos'>;
export type OrcamentoUpdate = TablesUpdate<'orcamentos'>;
export type OrcamentoStatus = Orcamento['status'];

export function useCreateOrcamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: OrcamentoInsert): Promise<Orcamento> => {
      const { data, error } = await supabase
        .from('orcamentos')
        .insert(values)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Orçamento criado mas dados não retornados');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar orçamento');
    },
  });
}

export function useUpdateOrcamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: OrcamentoUpdate }): Promise<Orcamento> => {
      const { data, error } = await supabase
        .from('orcamentos')
        .update(values)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error(`Orçamento ${id} não encontrado`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar orçamento');
    },
  });
}

export function useUpdateOrcamentoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrcamentoStatus }): Promise<Orcamento> => {
      const { data, error } = await supabase
        .from('orcamentos')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error(`Orçamento ${id} não encontrado`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });
}

export function useDeleteOrcamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('orcamentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir orçamento');
    },
  });
}
