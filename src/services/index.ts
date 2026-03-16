export { EsquadriaService } from '@/services/esquadria.service';
export { CuttingService } from '@/services/cutting.service';
export { PricingService } from '@/services/pricing.service';
export { OrcamentoService } from '@/services/orcamento.service';
export { ProductionService } from '@/services/production.service';
export { PipelineService } from '@/services/pipeline.service';
export { InventoryService } from '@/services/inventory.service';
export { CatalogImportService } from '@/services/catalog-import.service';
export { eventBus } from '@/services/eventBus';

export type { EsquadriaConfig, Peca, ListaMateriais, ValidationResult as EsquadriaValidation } from '@/services/esquadria.service';
export type { PecaCorte, Barra, ResultadoCorte, RelatorioCorte } from '@/services/cutting.service';
export type { ConfigPrecos, MaterialParaCalculo, CustoCalculado } from '@/services/pricing.service';
export type { OrcamentoItemInput, OrcamentoItem, OrcamentoGerado } from '@/services/orcamento.service';
export type { PedidoItem, OrdemProducao, PedidoCompra } from '@/services/production.service';
export type { PipelineResult, PipelineError } from '@/services/pipeline.service';
export type { InventoryItem, InventoryItemTipo, StockAlert } from '@/services/inventory.service';
export type { ImportJob, PerfilExtraido, ModeloExtraido, CatalogExtractedData } from '@/services/catalog-import.service';
export type { PipelineEventMap, InventoryGap } from '@/services/eventBus';
