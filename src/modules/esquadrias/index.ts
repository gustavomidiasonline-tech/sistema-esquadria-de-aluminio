// Módulo: Esquadrias
// Exporta services e tipos para o motor de cálculo de esquadrias

export { EsquadriaService } from '@/services/esquadria.service';
export type {
  EsquadriaConfig,
  Peca,
  ListaMateriais,
  ValidationResult,
} from '@/services/esquadria.service';

export { CuttingService } from '@/services/cutting.service';
export type { PecaCorte, ResultadoCorte, RelatorioCorte } from '@/services/cutting.service';

export { PricingService } from '@/services/pricing.service';
export type { ConfigPrecos, MaterialParaCalculo, CustoCalculado } from '@/services/pricing.service';
