import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';

export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  cnpj_cpf?: string;
  created_at: string;
}

export function useClientes() {
  return useSupabaseQuery<Cliente[]>('clientes', {
    orderBy: { column: 'nome', ascending: true },
  });
}
