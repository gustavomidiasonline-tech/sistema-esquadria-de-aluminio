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

  const KERF = 3; // mm — perda de lâmina de serra por corte

  for (const peca of pecas) {
    if (peca.comprimento <= 0 || peca.comprimento > comprimentoBarra) continue;

    // Find first bar that fits (accounting for kerf per cut)
    let placed = false;
    for (const barra of barras) {
      const kerfConsumido = barra.cortes.length * KERF;
      const usado = barra.cortes.reduce((s, c) => s + c.comprimento, 0);
      // New piece needs its length + 1 kerf (cut to separate it)
      if (usado + kerfConsumido + peca.comprimento + KERF <= comprimentoBarra) {
        barra.cortes.push(peca);
        barra.sobra_mm = comprimentoBarra - usado - kerfConsumido - peca.comprimento - KERF;
        barra.aproveitamento_pct = Math.round(((usado + kerfConsumido + peca.comprimento + KERF) / comprimentoBarra) * 100);
        placed = true;
        break;
      }
    }

    if (!placed) {
      barras.push({
        barra_mm: comprimentoBarra,
        cortes: [peca],
        sobra_mm: comprimentoBarra - peca.comprimento - KERF,
        aproveitamento_pct: Math.round(((peca.comprimento + KERF) / comprimentoBarra) * 100),
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

export const KERF_MM = 3; // mm — espessura da lâmina de serra

export interface GrupoCorteOtimizado {
  perfil_codigo: string;
  perfil_nome: string;
  total_pecas: number;
  otimizacao: ResultadoOtimizacao;
}

export interface ItemVidro {
  descricao: string;
  largura_mm: number;
  altura_mm: number;
  quantidade: number;
  area_m2: number;
}

export interface ItemFerragem {
  nome: string;
  quantidade: number;
  unidade: string;
  observacao?: string;
}

/**
 * Otimiza barras agrupando por código de perfil
 * Cada tipo de perfil tem seu próprio plano de corte
 */
export function otimizarBarrasPorPerfil(
  cortes: ResultadoCorte[],
  comprimentoBarra: number = 6000
): GrupoCorteOtimizado[] {
  const grupos = new Map<string, { nome: string; cortes: ResultadoCorte[] }>();
  for (const corte of cortes) {
    if (!grupos.has(corte.perfil_codigo)) {
      grupos.set(corte.perfil_codigo, { nome: corte.perfil_nome, cortes: [] });
    }
    grupos.get(corte.perfil_codigo)!.cortes.push(corte);
  }

  return Array.from(grupos.entries()).map(([codigo, grupo]) => {
    const otimizacao = otimizarBarras(grupo.cortes, comprimentoBarra);
    const total_pecas = grupo.cortes.reduce((s, c) => s + c.quantidade, 0);
    return { perfil_codigo: codigo, perfil_nome: grupo.nome, total_pecas, otimizacao };
  });
}

/**
 * Calcula dimensões de vidro por folha conforme tipologia
 */
export function calcularVidros(
  tipo: string,
  largura: number,
  altura: number,
  folhas: number
): ItemVidro[] {
  const t = (tipo || '').toLowerCase();
  const nf = Math.max(1, folhas || 2);

  if (t === 'correr' || t === 'correr_2f') {
    const vidL = Math.max(1, Math.round(largura / 2 - 70));
    const vidA = Math.max(1, Math.round(altura - 90));
    return [{
      descricao: 'Vidro folha correr (2F)',
      largura_mm: vidL,
      altura_mm: vidA,
      quantidade: 2,
      area_m2: Math.round((vidL * vidA * 2) / 1_000_000 * 100) / 100,
    }];
  }
  if (t === 'correr_4f') {
    const vidL = Math.max(1, Math.round(largura / 4 - 60));
    const vidA = Math.max(1, Math.round(altura - 90));
    return [{
      descricao: 'Vidro folha correr (4F)',
      largura_mm: vidL,
      altura_mm: vidA,
      quantidade: 4,
      area_m2: Math.round((vidL * vidA * 4) / 1_000_000 * 100) / 100,
    }];
  }
  if (t === 'fixo') {
    const vidL = Math.max(1, Math.round(largura - 50));
    const vidA = Math.max(1, Math.round(altura - 50));
    return [{
      descricao: 'Vidro fixo',
      largura_mm: vidL,
      altura_mm: vidA,
      quantidade: 1,
      area_m2: Math.round((vidL * vidA) / 1_000_000 * 100) / 100,
    }];
  }
  if (t === 'basculante') {
    const vidL = Math.max(1, Math.round(largura - 40));
    const vidA = Math.max(1, Math.round(altura - 40));
    return [{
      descricao: 'Vidro basculante',
      largura_mm: vidL,
      altura_mm: vidA,
      quantidade: 1,
      area_m2: Math.round((vidL * vidA) / 1_000_000 * 100) / 100,
    }];
  }
  if (t === 'maxim-ar' || t === 'maximar') {
    const numFolhas = Math.max(1, Math.floor(altura / 300));
    const vidL = Math.max(1, Math.round(largura - 30));
    const vidA = Math.max(1, Math.round((altura - 40) / numFolhas - 20));
    return [{
      descricao: `Vidro maxim-ar (${numFolhas}F)`,
      largura_mm: vidL,
      altura_mm: vidA,
      quantidade: numFolhas,
      area_m2: Math.round((vidL * vidA * numFolhas) / 1_000_000 * 100) / 100,
    }];
  }
  if (t === 'porta' || t.includes('porta')) {
    const vidL = Math.max(1, Math.round(largura / nf - 70));
    const vidA = Math.max(1, Math.round(altura - 100));
    return [{
      descricao: `Vidro porta (${nf}F)`,
      largura_mm: vidL,
      altura_mm: vidA,
      quantidade: nf,
      area_m2: Math.round((vidL * vidA * nf) / 1_000_000 * 100) / 100,
    }];
  }
  // Genérico
  const vidL = Math.max(1, Math.round(largura / nf - 60));
  const vidA = Math.max(1, Math.round(altura - 80));
  return [{
    descricao: `Vidro (${nf}F)`,
    largura_mm: vidL,
    altura_mm: vidA,
    quantidade: nf,
    area_m2: Math.round((vidL * vidA * nf) / 1_000_000 * 100) / 100,
  }];
}

/**
 * Gera lista de ferragens automática por tipologia
 */
export function calcularFerragens(
  tipo: string,
  largura: number,
  altura: number,
  folhas: number
): ItemFerragem[] {
  const t = (tipo || '').toLowerCase();
  const nf = Math.max(1, folhas || 2);
  const perimetroM = Math.round(((largura + altura) * 2) / 1000);

  if (t === 'correr' || t === 'correr_2f' || t === 'correr_4f') {
    const f = t === 'correr_4f' ? 4 : nf;
    return [
      { nome: 'Roldana inferior', quantidade: f * 2, unidade: 'un', observacao: '2 por folha' },
      { nome: 'Fecho de segurança', quantidade: Math.max(1, Math.floor(f / 2)), unidade: 'un' },
      { nome: 'Puxador com roseta', quantidade: f, unidade: 'un', observacao: '1 por folha' },
      { nome: 'Escova lateral anti-vento', quantidade: f * 2, unidade: 'un' },
      { nome: 'Escova de soleira', quantidade: f, unidade: 'un' },
      { nome: 'Batente de borracha', quantidade: 2, unidade: 'un' },
      { nome: 'Parafusos e buchas (fixação)', quantidade: 1, unidade: 'kit' },
    ];
  }
  if (t === 'fixo') {
    return [
      { nome: 'Silicone estrutural (300ml)', quantidade: 2, unidade: 'tubo' },
      { nome: 'Fita de vedação EPDM', quantidade: perimetroM, unidade: 'm' },
      { nome: 'Parafusos p/ fixação marco', quantidade: 1, unidade: 'kit' },
      { nome: 'Bucha de ancoragem', quantidade: 8, unidade: 'un' },
    ];
  }
  if (t === 'basculante') {
    return [
      { nome: 'Braço articulado (pistão)', quantidade: 2, unidade: 'un' },
      { nome: 'Fecho basculante', quantidade: 1, unidade: 'un' },
      { nome: 'Dobradiça reforçada', quantidade: 2, unidade: 'un' },
      { nome: 'Batente com borracha', quantidade: 2, unidade: 'un' },
      { nome: 'Parafusos e buchas', quantidade: 1, unidade: 'kit' },
    ];
  }
  if (t === 'maxim-ar' || t === 'maximar') {
    const numFolhas = Math.max(1, Math.floor(altura / 300));
    return [
      { nome: 'Barra de articulação (varão)', quantidade: numFolhas, unidade: 'un' },
      { nome: 'Gancho de fixação', quantidade: numFolhas * 2, unidade: 'un' },
      { nome: 'Fecho maxim-ar', quantidade: 1, unidade: 'un' },
      { nome: 'Parafusos e buchas', quantidade: 1, unidade: 'kit' },
    ];
  }
  if (t === 'porta' || t.includes('porta')) {
    return [
      { nome: 'Dobradiça 3" inox', quantidade: nf * 3, unidade: 'un', observacao: '3 por folha' },
      { nome: 'Fechadura cilíndrica', quantidade: nf, unidade: 'un' },
      { nome: 'Puxador tubular', quantidade: nf, unidade: 'un' },
      { nome: 'Roldana inferior (porta correr)', quantidade: nf * 2, unidade: 'un' },
      { nome: 'Batente magnético', quantidade: nf, unidade: 'un' },
      { nome: 'Parafusos e buchas', quantidade: 1, unidade: 'kit' },
    ];
  }
  // Genérico
  return [
    { nome: 'Parafusos e buchas', quantidade: 1, unidade: 'kit' },
    { nome: 'Silicone vedação', quantidade: 1, unidade: 'tubo' },
  ];
}

/**
 * Gera lista de materiais auxiliares
 */
export function calcularMateriaisAuxiliares(
  tipo: string,
  largura: number,
  altura: number
): ItemFerragem[] {
  const perimetroM = Math.ceil(((largura + altura) * 2) / 1000);
  return [
    { nome: 'Silicone incolor (280ml)', quantidade: Math.max(1, Math.ceil(perimetroM / 8)), unidade: 'tubo', observacao: 'Vedação final' },
    { nome: 'Fita dupla-face 19mm', quantidade: perimetroM, unidade: 'm', observacao: 'Fixação de vedação' },
    { nome: 'Parafuso auto-atarraxante 3,5x25', quantidade: 20, unidade: 'un' },
    { nome: 'Bucha plástica S6', quantidade: 10, unidade: 'un' },
    { nome: 'Primer para alumínio', quantidade: 1, unidade: 'un', observacao: 'Se pintura campo' },
  ];
}
