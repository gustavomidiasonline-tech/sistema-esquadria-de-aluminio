import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Database } from "@/integrations/supabase/types";

type ConfigPrecosRow = Database["public"]["Tables"]["config_precos"]["Row"];

export interface PricingConfig {
  preco_kg_aluminio: number;
  preco_m2_vidro_temperado_6mm: number;
  preco_m2_vidro_temperado_8mm: number;
  preco_m2_vidro_temperado_10mm: number;
  preco_m2_vidro_laminado_8mm: number;
  preco_m2_vidro_comum_4mm: number;
  custo_ferragem_janela: number;
  custo_ferragem_porta: number;
  custo_ferragem_basculante: number;
  custo_ferragem_maximar: number;
  custo_ferragem_pivotante: number;
  custo_acessorios_padrao: number;
  markup_padrao: number;
  custo_mao_de_obra_hora: number;
  horas_producao_janela: number;
  horas_producao_porta: number;
  horas_instalacao_padrao: number;
  [key: string]: number;
}

export const VIDRO_TYPES: Record<string, string> = {
  temperado_6mm: "Temperado Incolor 6mm",
  temperado_8mm: "Temperado Incolor 8mm",
  temperado_10mm: "Temperado Incolor 10mm",
  laminado_8mm: "Laminado Incolor 8mm",
  comum_4mm: "Comum Incolor 4mm",
};

const VIDRO_KEY_MAP: Record<string, string> = {
  temperado_6mm: "preco_m2_vidro_temperado_6mm",
  temperado_8mm: "preco_m2_vidro_temperado_8mm",
  temperado_10mm: "preco_m2_vidro_temperado_10mm",
  laminado_8mm: "preco_m2_vidro_laminado_8mm",
  comum_4mm: "preco_m2_vidro_comum_4mm",
};

const DEFAULT_CONFIG: PricingConfig = {
  preco_kg_aluminio: 38,
  preco_m2_vidro_temperado_6mm: 105,
  preco_m2_vidro_temperado_8mm: 135,
  preco_m2_vidro_temperado_10mm: 165,
  preco_m2_vidro_laminado_8mm: 180,
  preco_m2_vidro_comum_4mm: 65,
  custo_ferragem_janela: 45,
  custo_ferragem_porta: 120,
  custo_ferragem_basculante: 35,
  custo_ferragem_maximar: 55,
  custo_ferragem_pivotante: 280,
  custo_acessorios_padrao: 25,
  markup_padrao: 35,
  custo_mao_de_obra_hora: 45,
  horas_producao_janela: 2.5,
  horas_producao_porta: 4,
  horas_instalacao_padrao: 1.5,
};

export interface CostBreakdown {
  custoAluminio: number;
  custoVidro: number;
  custoFerragem: number;
  custoAcessorios: number;
  custoMaoObra: number;
  custoTotal: number;
  markup: number;
  lucro: number;
  precoVenda: number;
  pesoTotalKg: number;
  areaVidroM2: number;
}

export function usePricingConfig() {
  const { data: configRows = [], isLoading } = useQuery({
    queryKey: ["config_precos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config_precos")
        .select("*");
      if (error) return [];
      return data || [];
    },
  });

  const config = useMemo<PricingConfig>(() => {
    const result = { ...DEFAULT_CONFIG };
    configRows.forEach((row: ConfigPrecosRow) => {
      if (row.chave && row.valor !== undefined) {
        result[row.chave] = Number(row.valor);
      }
    });
    return result;
  }, [configRows]);

  function getGlassPrice(tipoVidro: string): number {
    const key = VIDRO_KEY_MAP[tipoVidro];
    return key ? config[key] : config.preco_m2_vidro_temperado_6mm;
  }

  function getHardwareCost(tipoEsquadria: string): number {
    const tipo = tipoEsquadria.toLowerCase();
    if (tipo.includes("porta") || tipo.includes("portao")) return config.custo_ferragem_porta;
    if (tipo.includes("basculante")) return config.custo_ferragem_basculante;
    if (tipo.includes("maxim")) return config.custo_ferragem_maximar;
    if (tipo.includes("pivotante")) return config.custo_ferragem_pivotante;
    return config.custo_ferragem_janela;
  }

  function getProductionHours(tipoEsquadria: string): number {
    const tipo = tipoEsquadria.toLowerCase();
    if (tipo.includes("porta") || tipo.includes("portao")) return config.horas_producao_porta;
    return config.horas_producao_janela;
  }

  function calculateCost(params: {
    perfis: { peso_metro: number; comprimento_mm: number; quantidade: number }[];
    largura_mm: number;
    altura_mm: number;
    tipoVidro: string;
    tipoEsquadria: string;
    folhas: number;
    markup?: number;
    quantidade: number;
  }): CostBreakdown {
    const { perfis, largura_mm, altura_mm, tipoVidro, tipoEsquadria, folhas, quantidade } = params;
    const mkp = params.markup ?? config.markup_padrao;

    // 1. Aluminum cost - sum of profile weights × price per kg
    let pesoTotalKg = 0;
    perfis.forEach((p) => {
      const comprimentoM = p.comprimento_mm / 1000;
      pesoTotalKg += comprimentoM * p.peso_metro * p.quantidade;
    });
    const custoAluminio = pesoTotalKg * config.preco_kg_aluminio;

    // 2. Glass cost - area × price per m² × number of glass panels (typically = folhas)
    const areaVidroM2 = (largura_mm / 1000) * (altura_mm / 1000);
    // Glass area per panel ≈ panel area (simplification, subtracting frame)
    const areaVidroReal = areaVidroM2 * 0.85; // ~85% of total area is glass
    const areaVidroTotal = areaVidroReal * folhas;
    const custoVidro = areaVidroTotal * getGlassPrice(tipoVidro);

    // 3. Hardware cost
    const custoFerragem = getHardwareCost(tipoEsquadria) * folhas;

    // 4. Accessories cost
    const custoAcessorios = config.custo_acessorios_padrao;

    // 5. Labor cost
    const horasProducao = getProductionHours(tipoEsquadria);
    const custoMaoObra = (horasProducao + config.horas_instalacao_padrao) * config.custo_mao_de_obra_hora;

    // Total cost per unit
    const custoUnitario = custoAluminio + custoVidro + custoFerragem + custoAcessorios + custoMaoObra;
    const custoTotal = custoUnitario * quantidade;

    // Apply markup
    const lucro = custoTotal * (mkp / 100);
    const precoVenda = custoTotal + lucro;

    return {
      custoAluminio: custoAluminio * quantidade,
      custoVidro: custoVidro * quantidade,
      custoFerragem: custoFerragem * quantidade,
      custoAcessorios: custoAcessorios * quantidade,
      custoMaoObra: custoMaoObra * quantidade,
      custoTotal,
      markup: mkp,
      lucro,
      precoVenda,
      pesoTotalKg: pesoTotalKg * quantidade,
      areaVidroM2: areaVidroTotal * quantidade,
    };
  }

  return { config, isLoading, getGlassPrice, getHardwareCost, calculateCost };
}
