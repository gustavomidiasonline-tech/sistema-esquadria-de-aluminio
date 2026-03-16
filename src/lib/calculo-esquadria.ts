/**
 * Motor de Cálculo de Esquadrias
 * Avalia fórmulas de componentes e gera lista de corte com otimização de barras
 */

export interface ComponenteCalculo {
  perfil_id: string | null;
  perfil_codigo: string;
  perfil_nome: string;
  quantidade: number;
  formula: string;
  posicao: string;
  comprimento_mm: number;
  peso_kg_m: number;
}

export interface ResultadoCorte {
  perfil_codigo: string;
  perfil_nome: string;
  perfil_id: string | null;
  comprimento_mm: number;
  quantidade: number;
  posicao: string;
  peso_total_kg: number;
}

export interface BarraOtimizada {
  barra_mm: number;
  cortes: { comprimento: number; codigo: string; posicao: string }[];
  sobra_mm: number;
  aproveitamento_pct: number;
}

export interface ResultadoOtimizacao {
  barras: BarraOtimizada[];
  total_barras: number;
  aproveitamento_medio: number;
  sobra_total_mm: number;
}

/** Avalia uma fórmula simples de cálculo de perfil */
export function avaliarFormula(formula: string, largura: number, altura: number, folhas: number): number {
  try {
    // Replace variables
    const expr = formula
      .replace(/largura_total/g, String(largura))
      .replace(/altura_total/g, String(altura))
      .replace(/largura/g, String(largura))
      .replace(/altura/g, String(altura))
      .replace(/folhas/g, String(folhas || 2));

    // Safe eval: only allow numbers, operators, parentheses, spaces
    if (!/^[\d\s+\-*/().]+$/.test(expr)) {
      console.warn('Formula inválida:', formula, '->', expr);
      return 0;
    }

    const result = Function(`"use strict"; return (${expr})`)();
    return Math.round(Number(result));
  } catch (e) {
    console.warn('Erro ao avaliar fórmula:', formula, e);
    return 0;
  }
}

/** Calcula todos os componentes de uma esquadria */
export function calcularComponentes(
  componentes: {
    perfil_id: string | null;
    perfil_codigo: string;
    perfil_nome: string;
    quantidade: number;
    formula_calculo: string;
    posicao: string | null;
    peso_kg_m: number;
  }[],
  largura: number,
  altura: number,
  folhas: number
): ResultadoCorte[] {
  return componentes.map((comp) => {
    const comprimento = avaliarFormula(comp.formula_calculo, largura, altura, folhas);
    const peso_total = (comprimento / 1000) * comp.peso_kg_m * comp.quantidade;

    return {
      perfil_codigo: comp.perfil_codigo,
      perfil_nome: comp.perfil_nome,
      perfil_id: comp.perfil_id,
      comprimento_mm: comprimento,
      quantidade: comp.quantidade,
      posicao: comp.posicao || '',
      peso_total_kg: Math.round(peso_total * 100) / 100,
    };
  });
}

/** Algoritmo First Fit Decreasing para otimização de barras */
export function otimizarBarras(
  cortes: ResultadoCorte[],
  comprimentoBarra: number = 6000
): ResultadoOtimizacao {
  // Expand cuts into individual pieces
  const pecas: { comprimento: number; codigo: string; posicao: string }[] = [];
  for (const corte of cortes) {
    for (let i = 0; i < corte.quantidade; i++) {
      pecas.push({
        comprimento: corte.comprimento_mm,
        codigo: corte.perfil_codigo,
        posicao: corte.posicao,
      });
    }
  }

  // Sort descending (FFD)
  pecas.sort((a, b) => b.comprimento - a.comprimento);

  const barras: BarraOtimizada[] = [];

  for (const peca of pecas) {
    if (peca.comprimento <= 0 || peca.comprimento > comprimentoBarra) continue;

    // Find first bar that fits
    let placed = false;
    for (const barra of barras) {
      const usado = barra.cortes.reduce((s, c) => s + c.comprimento, 0);
      if (usado + peca.comprimento <= comprimentoBarra) {
        barra.cortes.push(peca);
        barra.sobra_mm = comprimentoBarra - usado - peca.comprimento;
        barra.aproveitamento_pct = Math.round(((usado + peca.comprimento) / comprimentoBarra) * 100);
        placed = true;
        break;
      }
    }

    if (!placed) {
      barras.push({
        barra_mm: comprimentoBarra,
        cortes: [peca],
        sobra_mm: comprimentoBarra - peca.comprimento,
        aproveitamento_pct: Math.round((peca.comprimento / comprimentoBarra) * 100),
      });
    }
  }

  const total_barras = barras.length;
  const sobra_total = barras.reduce((s, b) => s + b.sobra_mm, 0);
  const aproveitamento_medio = total_barras > 0
    ? Math.round(barras.reduce((s, b) => s + b.aproveitamento_pct, 0) / total_barras)
    : 0;

  return { barras, total_barras, aproveitamento_medio, sobra_total_mm: sobra_total };
}
