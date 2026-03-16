import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Pedido = Tables<'pedidos'>;

export function usePedidos() {
  return useQuery({
    queryKey: ['pedidos'],
    queryFn: async (): Promise<Pedido[]> => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('data_entrega', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}
