/**
 * OrcamentoService — Geração automática de orçamentos
 * Lógica pura: sem dependências de React ou UI
 */

import { EsquadriaService, type EsquadriaConfig, type ListaMateriais } from '@/services/esquadria.service';
import { PricingService, type ConfigPrecos, type CustoCalculado } from '@/services/pricing.service';

export interface OrcamentoItemInput {
  produto_id: string;
  produto_nome: string;
  largura: number;
  altura: number;
  quantidade: number;
  modelo: string;
  numFolhas?: number;
}

export interface OrcamentoItem {
  produto_id: string;
  produto_nome: string;
  largura: number;
  altura: number;
  quantidade: number;
  listaMateriais: ListaMateriais;
  custo: CustoCalculado;
  precoUnitario: number;
  precoTotal: number;
  margemAplicada: number;
}

export interface OrcamentoGerado {
  itens: OrcamentoItem[];
  totalCusto: number;
  totalVenda: number;
  totalLucro: number;
  margemMedia: number;
}

export interface ValidationResult {
  valido: boolean;
  erros: string[];
}

export const OrcamentoService = {
  /**
   * Gera orçamento automático para um item de esquadria
   */
  gerarItem(
    input: OrcamentoItemInput,
    configPrecos: ConfigPrecos,
    margem: number = 30
  ): OrcamentoItem {
    const config: EsquadriaConfig = {
      modelo: input.modelo,
      largura: input.largura,
      altura: input.altura,
      numFolhas: input.numFolhas,
    };

    const pecas = EsquadriaService.calcularPerfis(config);
    const listaMateriais = EsquadriaService.calcularListaMateriais(pecas);

    // Converter peças em materiais para pricing
    const materiais = pecas.map((peca) => ({
      tipo: 'aluminio' as const,
      descricao: `${peca.posicao} (${peca.comprimento}mm x ${peca.quantidade})`,
      quantidade: (peca.comprimento / 1000) * peca.quantidade,
      unidade: 'kg' as const,
    }));

    // Adicionar vidro
    const areaVidro = EsquadriaService.calcularAreaVidro(input.largura, input.altura, input.numFolhas);
    materiais.push({
      tipo: 'vidro' as const,
      descricao: `Vidro ${input.largura}x${input.altura}mm`,
      quantidade: areaVidro,
      unidade: 'm2' as const,
    });

    const custo = PricingService.calcularCusto(materiais, configPrecos);
    const precoUnitario = PricingService.calcularPrecoFinal(custo, margem);

    return {
      produto_id: input.produto_id,
      produto_nome: input.produto_nome,
      largura: input.largura,
      altura: input.altura,
      quantidade: input.quantidade,
      listaMateriais,
      custo,
      precoUnitario,
      precoTotal: Math.round(precoUnitario * input.quantidade * 100) / 100,
      margemAplicada: margem,
    };
  },

  /**
   * Gera orçamento completo para múltiplos itens
   */
  gerarOrcamento(
    itens: OrcamentoItemInput[],
    configPrecos: ConfigPrecos,
    margem: number = 30
  ): OrcamentoGerado {
    const itensGerados = itens.map((item) =>
      OrcamentoService.gerarItem(item, configPrecos, margem)
    );

    const totalCusto = itensGerados.reduce((acc, i) => acc + i.custo.custoTotal * i.quantidade, 0);
    const totalVenda = itensGerados.reduce((acc, i) => acc + i.precoTotal, 0);
    const totalLucro = totalVenda - totalCusto;
    const margemMedia = totalVenda > 0 ? (totalLucro / totalVenda) * 100 : 0;

    return {
      itens: itensGerados,
      totalCusto: Math.round(totalCusto * 100) / 100,
      totalVenda: Math.round(totalVenda * 100) / 100,
      totalLucro: Math.round(totalLucro * 100) / 100,
      margemMedia: Math.round(margemMedia * 100) / 100,
    };
  },

  /**
   * Calcula total de um orçamento com itens já processados
   */
  calcularTotalOrcamento(itens: OrcamentoItem[]): number {
    return itens.reduce((acc, item) => acc + item.precoTotal, 0);
  },

  /**
   * Valida um orçamento antes de salvar
   */
  validarOrcamento(
    clienteId: string | undefined,
    itens: OrcamentoItem[]
  ): ValidationResult {
    const erros: string[] = [];

    if (!clienteId) erros.push('Cliente é obrigatório');
    if (!itens || itens.length === 0) erros.push('Orçamento deve ter pelo menos 1 item');

    for (const item of itens) {
      if (item.largura <= 0) erros.push(`Item ${item.produto_nome}: largura inválida`);
      if (item.altura <= 0) erros.push(`Item ${item.produto_nome}: altura inválida`);
      if (item.quantidade <= 0) erros.push(`Item ${item.produto_nome}: quantidade inválida`);
    }

    return { valido: erros.length === 0, erros };
  },
};
