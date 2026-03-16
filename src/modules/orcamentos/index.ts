// Módulo: Orçamentos
// Exporta hooks, tipos, repository e service para o domínio de orçamentos

export { useOrcamentos } from '@/hooks/useOrcamentos';
export type { Orcamento, OrcamentoComCliente } from '@/hooks/useOrcamentos';

export {
  useCreateOrcamento,
  useUpdateOrcamento,
  useUpdateOrcamentoStatus,
  useDeleteOrcamento,
} from '@/hooks/useOrcamentoMutations';
export type { OrcamentoInsert, OrcamentoUpdate, OrcamentoStatus } from '@/hooks/useOrcamentoMutations';

export { OrcamentosRepository } from '@/repositories/orcamentos.repository';
export { OrcamentoService } from '@/services/orcamento.service';
