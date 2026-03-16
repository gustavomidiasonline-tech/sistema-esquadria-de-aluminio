import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Pedido = Tables<'pedidos'>;
export type PedidoInsert = TablesInsert<'pedidos'>;
export type PedidoUpdate = TablesUpdate<'pedidos'>;
export type PedidoStatus = Pedido['status'];

export function useCreatePedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: PedidoInsert): Promise<Pedido> => {
      const { data, error } = await supabase
        .from('pedidos')
        .insert(values)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Pedido criado mas dados não retornados');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar pedido');
    },
  });
}

export function useUpdatePedidoStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PedidoStatus }): Promise<Pedido> => {
      const { data, error } = await supabase
        .from('pedidos')
        .update({ status } as TablesUpdate<'pedidos'>)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error(`Pedido ${id} não encontrado`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status do pedido');
    },
  });
}
