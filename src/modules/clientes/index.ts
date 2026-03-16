// Módulo: Clientes
// Exporta hooks, tipos e repository para o domínio de clientes

export { useClientes } from '@/hooks/useClientes';
export type { Cliente } from '@/hooks/useClientes';

export { useCreateCliente, useUpdateCliente, useDeleteCliente } from '@/hooks/useClienteMutations';
export type { ClienteInsert, ClienteUpdate } from '@/hooks/useClienteMutations';

export { ClientesRepository } from '@/repositories/clientes.repository';
