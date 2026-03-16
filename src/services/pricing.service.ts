/**
 * PricingService — Motor de cálculo de preços
 * Lógica pura: sem dependências de React ou UI
 */

export interface ConfigPrecos {
  preco_kg_aluminio: number;
  preco_m2_vidro: number;
  preco_hora_mao_obra: number;
  frete_percentual: number;
  impostos_percentual: number;
}

export interface MaterialParaCalculo {
  tipo: 'aluminio' | 'vidro' | 'ferragem' | 'acessorio' | 'mao_obra';
  descricao: string;
  quantidade: number;
  unidade: 'kg' | 'm2' | 'un' | 'h';
  precoUnitario?: number;  // se não informado, usa config padrão
}

export interface CustoCalculado {
  custoMateriais: number;
  custoMaoObra: number;
  custoFrete: number;
  impostos: number;
  custoTotal: number;
  detalhamento: Array<{
    descricao: string;
    quantidade: number;
    unidade: string;
    precoUnitario: number;
    subtotal: number;
  }>;
}

export const PricingService = {
  /**
   * Calcula o custo total de uma lista de materiais
   */
  calcularCusto(materiais: MaterialParaCalculo[], config: ConfigPrecos): CustoCalculado {
    const detalhamento: CustoCalculado['detalhamento'] = [];
    let custoMateriais = 0;
    let custoMaoObra = 0;

    for (const material of materiais) {
      const precoUnitario = material.precoUnitario ?? obterPrecoPadrao(material.tipo, config);
      const subtotal = material.quantidade * precoUnitario;

      detalhamento.push({
        descricao: material.descricao,
        quantidade: material.quantidade,
        unidade: material.unidade,
        precoUnitario,
        subtotal,
      });

      if (material.tipo === 'mao_obra') {
        custoMaoObra += subtotal;
      } else {
        custoMateriais += subtotal;
      }
    }

    const subtotalSemFrete = custoMateriais + custoMaoObra;
    const custoFrete = subtotalSemFrete * (config.frete_percentual / 100);
    const baseImpostos = subtotalSemFrete + custoFrete;
    const impostos = baseImpostos * (config.impostos_percentual / 100);

    return {
      custoMateriais,
      custoMaoObra,
      custoFrete: Math.round(custoFrete * 100) / 100,
      impostos: Math.round(impostos * 100) / 100,
      custoTotal: Math.round((subtotalSemFrete + custoFrete + impostos) * 100) / 100,
      detalhamento,
    };
  },

  /**
   * Aplica margem de lucro sobre o custo total
   */
  aplicarMargem(custoTotal: number, margemPercentual: number): number {
    if (margemPercentual <= 0) return custoTotal;
    const precoFinal = custoTotal / (1 - margemPercentual / 100);
    return Math.round(precoFinal * 100) / 100;
  },

  /**
   * Calcula preço final com margem e arredondamento
   */
  calcularPrecoFinal(
    custo: CustoCalculado,
    margemPercentual: number,
    arredondar: boolean = true
  ): number {
    const precoRaw = PricingService.aplicarMargem(custo.custoTotal, margemPercentual);
    if (!arredondar) return precoRaw;
    // Arredondamento comercial: para cima até próximo múltiplo de 0.50
    return Math.ceil(precoRaw * 2) / 2;
  },

  /**
   * Calcula o lucro estimado
   */
  calcularLucro(precoFinal: number, custoTotal: number): { valor: number; percentual: number } {
    const valor = precoFinal - custoTotal;
    const percentual = (valor / precoFinal) * 100;
    return {
      valor: Math.round(valor * 100) / 100,
      percentual: Math.round(percentual * 100) / 100,
    };
  },
};

function obterPrecoPadrao(
  tipo: MaterialParaCalculo['tipo'],
  config: ConfigPrecos
): number {
  switch (tipo) {
    case 'aluminio': return config.preco_kg_aluminio;
    case 'vidro': return config.preco_m2_vidro;
    case 'mao_obra': return config.preco_hora_mao_obra;
    default: return 0;
  }
}
