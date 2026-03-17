/**
 * useOrcamentos — Hook type-safe para Orcamentos
 * Substitui useSupabaseQuery<any> genérico
 * Story 7.3: Type Safety
 */

import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';

export interface Orcamento {
  id: string;
  cliente_id: string;
  descricao?: string;
  valor_total: number;
  status: string;
  validade?: string | null;
  observacoes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  clientes?: {
    nome: string;
    telefone?: string;
    email?: string;
    cidade?: string;
    estado?: string;
  };
}

export function useOrcamentos() {
  return useSupabaseQuery<Orcamento[]>('orcamentos', {
    select: '*, clientes(nome, telefone, email, cidade, estado)',
    orderBy: { column: 'created_at', ascending: false },
  });
}

export function useOrcamentoById(id: string) {
  const { data, isLoading, error } = useSupabaseQuery<Orcamento[]>('orcamentos', {
    select: '*, clientes(*), orcamento_itens(*)',
    filters: [{ column: 'id', operator: 'eq', value: id }],
  });

  return {
    orcamento: data?.[0],
    isLoading,
    error,
  };
}
