import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Orcamento = Tables<'orcamentos'>;
export type OrcamentoComCliente = Orcamento & {
  clientes: Pick<Tables<'clientes'>, 'id' | 'nome' | 'email' | 'telefone'> | null;
};

export function useOrcamentos() {
  return useQuery({
    queryKey: ['orcamentos'],
    queryFn: async (): Promise<OrcamentoComCliente[]> => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*, clientes(id, nome, email, telefone)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as OrcamentoComCliente[];
    },
  });
}
