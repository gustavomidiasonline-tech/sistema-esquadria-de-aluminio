import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MaterialInfo {
  acessorios: boolean;
  aluminios: boolean;
  vidros: boolean;
}

/**
 * Hook que detecta automaticamente quais materiais são necessários
 * baseado nas medidas fornecidas na etapa anterior
 *
 * Lógica simples:
 * - Se há largura/altura, assume que precisa dos 3 materiais
 * - Pode ser expandido para usar cut_rules mais complexas
 */
export function useAutoMateriais(
  pedidoId: string,
  previousStageData?: Record<string, unknown>
): MaterialInfo | null {
  const [materials, setMaterials] = useState<MaterialInfo | null>(null);

  useEffect(() => {
    const detectMaterials = async () => {
      // Se já temos dados da etapa anterior, usa eles
      if (previousStageData) {
        const largura = previousStageData.largura;
        const altura = previousStageData.altura;

        // Se tem medidas válidas, determina materiais necessários
        if (largura && altura) {
          const detected: MaterialInfo = {
            acessorios: true,
            aluminios: true,
            vidros: true,
          };
          setMaterials(detected);
          return;
        }
      }

      // Fallback: busca pedido_itens para ver se tem dimensões
      try {
        const { data: itens } = await supabase
          .from("pedido_itens")
          .select("largura, altura")
          .eq("pedido_id", pedidoId)
          .limit(1);

        if (itens && itens.length > 0 && itens[0].largura && itens[0].altura) {
          const detected: MaterialInfo = {
            acessorios: true,
            aluminios: true,
            vidros: true,
          };
          setMaterials(detected);
        } else {
          // Se não tem dados, deixa vazio
          setMaterials({
            acessorios: false,
            aluminios: false,
            vidros: false,
          });
        }
      } catch (error) {
        console.error("Erro ao detectar materiais:", error);
        setMaterials({
          acessorios: false,
          aluminios: false,
          vidros: false,
        });
      }
    };

    detectMaterials();
  }, [pedidoId, previousStageData]);

  return materials;
}
