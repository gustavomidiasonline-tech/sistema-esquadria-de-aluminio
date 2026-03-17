import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';

export interface OrcamentoItem {
  id: string;
  orcamento_id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  largura?: number | null;
  altura?: number | null;
  produto_id?: string | null;
  created_at: string;
}

export function useOrcamentoItens() {
  return useSupabaseQuery<OrcamentoItem[]>('orcamento_itens', {
    orderBy: { column: 'created_at', ascending: false },
  });
}

export function useOrcamentoItensById(orcId: string) {
  const { data, isLoading, error } = useSupabaseQuery<OrcamentoItem[]>('orcamento_itens', {
    filters: [{ column: 'orcamento_id', operator: 'eq', value: orcId }],
    orderBy: { column: 'created_at', ascending: false },
  });

  return { itens: data || [], isLoading, error };
}
