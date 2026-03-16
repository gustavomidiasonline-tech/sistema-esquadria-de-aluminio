// Módulo: Pedidos
// Exporta hooks, tipos, repository para o domínio de pedidos

export { usePedidos } from '@/hooks/usePedidos';
export type { Pedido } from '@/hooks/usePedidos';

export { useCreatePedido, useUpdatePedidoStatus } from '@/hooks/usePedidoMutations';
export type { PedidoInsert, PedidoUpdate, PedidoStatus } from '@/hooks/usePedidoMutations';

export { PedidosRepository } from '@/repositories/pedidos.repository';
