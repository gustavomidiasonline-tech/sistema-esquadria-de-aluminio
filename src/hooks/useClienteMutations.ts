import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Cliente = Tables<'clientes'>;
export type ClienteInsert = TablesInsert<'clientes'>;
export type ClienteUpdate = TablesUpdate<'clientes'>;

export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: ClienteInsert): Promise<Cliente> => {
      const { data, error } = await supabase
        .from('clientes')
        .insert(values)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Cliente criado mas dados não retornados');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar cliente');
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ClienteUpdate }): Promise<Cliente> => {
      const { data, error } = await supabase
        .from('clientes')
        .update(values)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error(`Cliente ${id} não encontrado`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar cliente');
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir cliente');
    },
  });
}
