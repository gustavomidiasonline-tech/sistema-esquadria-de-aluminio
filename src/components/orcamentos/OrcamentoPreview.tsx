/**
 * OrcamentoPreview — Preview de esquadria para orçamentos
 * Wrapper leve do EsquadriaPreview3D para usar em cards de orçamento
 */

import { EsquadriaPreview3D } from "@/components/esquadrias/EsquadriaPreview3D";

interface OrcamentoPreviewProps {
  tipo: string;
  largura: number;
  altura: number;
  folhas?: number;
  nome?: string;
}

export function OrcamentoPreview({ tipo, largura, altura, folhas = 2, nome }: OrcamentoPreviewProps) {
  return (
    <EsquadriaPreview3D
      tipo={tipo}
      largura={largura}
      altura={altura}
      folhas={folhas}
      nome={nome}
      showTabs={false}
      className="max-w-sm"
    />
  );
}
