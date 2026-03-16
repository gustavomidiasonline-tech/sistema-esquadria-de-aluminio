import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Produto = Tables<'produtos'>;
export type ProdutoComPerfil = Produto & {
  perfis_aluminio: Pick<Tables<'perfis_aluminio'>, 'id' | 'descricao' | 'codigo' | 'peso_metro'> | null;
};

export function useProdutos() {
  return useQuery({
    queryKey: ['produtos'],
    queryFn: async (): Promise<Produto[]> => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProdutosAtivos() {
  return useQuery({
    queryKey: ['produtos', 'ativos'],
    queryFn: async (): Promise<Produto[]> => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}
