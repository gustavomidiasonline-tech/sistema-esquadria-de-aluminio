/**
 * CuttingService — Algoritmo de otimização de plano de corte
 * Implementa First Fit Decreasing (FFD) e Best Fit Decreasing (BFD)
 * para minimizar desperdício de barras de alumínio
 */

import { getKerf } from '@/lib/formula-engine';

export interface PecaCorte {
  id: string;
  descricao: string;
  comprimento: number;  // mm
  quantidade: number;
}

export interface CorteNaBarra {
  pecaId: string;
  descricao: string;
  comprimento: number;
  posicaoInicio: number;
}

export interface Barra {
  numero: number;
  comprimentoTotal: number;
  cortes: CorteNaBarra[];
  sobra: number;
  aproveitamento: number;  // 0-100 %
}

export interface ResultadoCorte {
  barras: Barra[];
  totalBarras: number;
  totalCortes: number;
  sobra_total_mm: number;
  aproveitamento_medio: number;  // % média
  algoritmo: 'FFD' | 'BFD';
}

export interface RelatorioCorte {
  resumo: {
    totalBarras: number;
    comprimentoTotalUsado: number;
    comprimentoTotalSobra: number;
    aproveitamentoMedio: string;
    algoritmo: string;
  };
  barras: Array<{
    numero: number;
    comprimentoTotal: number;
    sobra: number;
    aproveitamento: string;
    cortes: Array<{ descricao: string; comprimento: number }>;
  }>;
}

const KERF = getKerf(); // mm — espessura do disco de corte (from FormulaEngine config)

export const CuttingService = {
  /**
   * Otimiza cortes usando o algoritmo selecionado
   * @param pecas Lista de peças a cortar
   * @param comprimentoBarra Comprimento padrão das barras (mm, ex: 6000)
   * @param algoritmo 'FFD' (default) ou 'BFD'
   */
  otimizarCortes(
    pecas: PecaCorte[],
    comprimentoBarra: number = 6000,
    algoritmo: 'FFD' | 'BFD' = 'FFD'
  ): ResultadoCorte {
    // Expandir quantidade em lista de comprimentos individuais
    const comprimentos: Array<{ id: string; descricao: string; comprimento: number }> = [];
    for (const peca of pecas) {
      for (let i = 0; i < peca.quantidade; i++) {
        comprimentos.push({ id: peca.id, descricao: peca.descricao, comprimento: peca.comprimento });
      }
    }

    // Ordenar decrescente (Decreasing do FFD/BFD)
    const ordenados = [...comprimentos].sort((a, b) => b.comprimento - a.comprimento);

    const barras: Barra[] =
      algoritmo === 'BFD'
        ? aplicarBestFit(ordenados, comprimentoBarra)
        : aplicarFirstFit(ordenados, comprimentoBarra);

    const sobraTotal = barras.reduce((acc, b) => acc + b.sobra, 0);
    const aproveitamentoMedio =
      barras.reduce((acc, b) => acc + b.aproveitamento, 0) / barras.length;

    return {
      barras,
      totalBarras: barras.length,
      totalCortes: comprimentos.length,
      sobra_total_mm: sobraTotal,
      aproveitamento_medio: Math.round(aproveitamentoMedio * 100) / 100,
      algoritmo,
    };
  },

  /**
   * Compara FFD vs BFD e retorna o melhor resultado
   */
  otimizarMelhor(pecas: PecaCorte[], comprimentoBarra: number = 6000): ResultadoCorte {
    const ffd = CuttingService.otimizarCortes(pecas, comprimentoBarra, 'FFD');
    const bfd = CuttingService.otimizarCortes(pecas, comprimentoBarra, 'BFD');

    // Preferir o que usar menos barras; em empate, maior aproveitamento
    if (ffd.totalBarras < bfd.totalBarras) return ffd;
    if (bfd.totalBarras < ffd.totalBarras) return bfd;
    return ffd.aproveitamento_medio >= bfd.aproveitamento_medio ? ffd : bfd;
  },

  /**
   * Calcula % de aproveitamento de uma barra
   */
  calcularAproveitamento(resultado: ResultadoCorte): number {
    return resultado.aproveitamento_medio;
  },

  /**
   * Gera relatório estruturado do plano de corte
   */
  gerarRelatorioCorte(resultado: ResultadoCorte): RelatorioCorte {
    const comprimentoTotalUsado = resultado.barras.reduce(
      (acc, b) => acc + (b.comprimentoTotal - b.sobra),
      0
    );

    return {
      resumo: {
        totalBarras: resultado.totalBarras,
        comprimentoTotalUsado,
        comprimentoTotalSobra: resultado.sobra_total_mm,
        aproveitamentoMedio: `${resultado.aproveitamento_medio.toFixed(1)}%`,
        algoritmo: resultado.algoritmo,
      },
      barras: resultado.barras.map((b) => ({
        numero: b.numero,
        comprimentoTotal: b.comprimentoTotal,
        sobra: b.sobra,
        aproveitamento: `${b.aproveitamento.toFixed(1)}%`,
        cortes: b.cortes.map((c) => ({ descricao: c.descricao, comprimento: c.comprimento })),
      })),
    };
  },
};

// --- Algoritmos internos ---

/**
 * First Fit Decreasing: coloca cada peça na primeira barra que couber.
 * Kerf model: each piece consumes (comprimento + KERF) on the bar.
 */
function aplicarFirstFit(
  pecas: Array<{ id: string; descricao: string; comprimento: number }>,
  comprimentoBarra: number
): Barra[] {
  const barras: Barra[] = [];

  for (const peca of pecas) {
    let alocado = false;
    const pecaComKerf = peca.comprimento + KERF;

    for (const barra of barras) {
      if (barra.sobra >= pecaComKerf) {
        const posicao = barra.comprimentoTotal - barra.sobra;
        barra.cortes.push({ pecaId: peca.id, descricao: peca.descricao, comprimento: peca.comprimento, posicaoInicio: posicao });
        barra.sobra -= pecaComKerf;
        barra.aproveitamento = calcularAproveitamentoBarra(barra);
        alocado = true;
        break;
      }
    }

    if (!alocado) {
      const novaBarra: Barra = {
        numero: barras.length + 1,
        comprimentoTotal: comprimentoBarra,
        cortes: [{ pecaId: peca.id, descricao: peca.descricao, comprimento: peca.comprimento, posicaoInicio: 0 }],
        sobra: comprimentoBarra - pecaComKerf,
        aproveitamento: 0,
      };
      novaBarra.aproveitamento = calcularAproveitamentoBarra(novaBarra);
      barras.push(novaBarra);
    }
  }

  return barras;
}

/**
 * Best Fit Decreasing: coloca cada peça na barra com menor sobra que ainda couber.
 * Kerf model: each piece consumes (comprimento + KERF) on the bar.
 */
function aplicarBestFit(
  pecas: Array<{ id: string; descricao: string; comprimento: number }>,
  comprimentoBarra: number
): Barra[] {
  const barras: Barra[] = [];

  for (const peca of pecas) {
    let melhorBarra: Barra | null = null;
    let melhorSobra = Infinity;
    const pecaComKerf = peca.comprimento + KERF;

    for (const barra of barras) {
      if (barra.sobra >= pecaComKerf) {
        const sobraResultante = barra.sobra - pecaComKerf;
        if (sobraResultante < melhorSobra) {
          melhorSobra = sobraResultante;
          melhorBarra = barra;
        }
      }
    }

    if (melhorBarra) {
      const posicao = melhorBarra.comprimentoTotal - melhorBarra.sobra;
      melhorBarra.cortes.push({ pecaId: peca.id, descricao: peca.descricao, comprimento: peca.comprimento, posicaoInicio: posicao });
      melhorBarra.sobra -= pecaComKerf;
      melhorBarra.aproveitamento = calcularAproveitamentoBarra(melhorBarra);
    } else {
      const novaBarra: Barra = {
        numero: barras.length + 1,
        comprimentoTotal: comprimentoBarra,
        cortes: [{ pecaId: peca.id, descricao: peca.descricao, comprimento: peca.comprimento, posicaoInicio: 0 }],
        sobra: comprimentoBarra - pecaComKerf,
        aproveitamento: 0,
      };
      novaBarra.aproveitamento = calcularAproveitamentoBarra(novaBarra);
      barras.push(novaBarra);
    }
  }

  return barras;
}

function calcularAproveitamentoBarra(barra: Barra): number {
  const usado = barra.comprimentoTotal - barra.sobra;
  return Math.round((usado / barra.comprimentoTotal) * 10000) / 100;
}
