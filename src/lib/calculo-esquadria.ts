/**
 * Motor de Cálculo de Esquadrias
 * Avalia fórmulas de componentes e gera lista de corte com otimização de barras
 */

import { getFolgaConfig, getKerf, type FolgaConfig } from '@/lib/formula-engine';

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
    const nf = folhas || 2;
    // Replace variables — longest names first to avoid partial matches
    const expr = formula
      .replace(/largura_total/g, String(largura))
      .replace(/altura_total/g, String(altura))
      .replace(/num_folhas/g, String(nf))
      .replace(/largura/g, String(largura))
      .replace(/altura/g, String(altura))
      .replace(/folhas/g, String(nf))
      .replace(/\bL\b/g, String(largura))
      .replace(/\bH\b/g, String(altura));

    // Safe eval: only allow numbers, operators, parentheses, spaces, decimals
    if (!/^[\d\s+\-*/().]+$/.test(expr)) {
      console.warn('Formula inválida:', formula, '->', expr);
      return 0;
    }

    // Use safe math evaluator instead of Function() to bypass CSP restrictions
    const result = evaluarExpressaoSegura(expr);
    const value = Number(result);
    if (!isFinite(value)) return 0;
    return Math.round(value);
  } catch (e) {
    console.warn('Erro ao avaliar fórmula:', formula, e);
    return 0;
  }
}

/** Avaliador seguro de expressões matemáticas (CSP-safe) */
function evaluarExpressaoSegura(expr: string): number {
  // Implementação simples de parser de expressões matemáticas
  // Suporta: números, +, -, *, /, parênteses
  const tokens = tokenizar(expr);
  const [resultado] = analisarExpressao(tokens, 0);
  return resultado;
}

function tokenizar(expr: string): (string | number)[] {
  const tokens: (string | number)[] = [];
  let current = '';

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];

    if (/\d|\./.test(char)) {
      current += char;
    } else if (/[\+\-\*/()]/.test(char)) {
      if (current) {
        tokens.push(Number(current));
        current = '';
      }
      tokens.push(char);
    } else if (/\s/.test(char)) {
      if (current) {
        tokens.push(Number(current));
        current = '';
      }
    }
  }

  if (current) tokens.push(Number(current));
  return tokens;
}

function analisarExpressao(tokens: (string | number)[], index: number): [number, number] {
  let [left, i] = analisarTermo(tokens, index);

  while (i < tokens.length && (tokens[i] === '+' || tokens[i] === '-')) {
    const op = tokens[i] as string;
    const [right, nextI] = analisarTermo(tokens, i + 1);
    left = op === '+' ? left + right : left - right;
    i = nextI;
  }

  return [left, i];
}

function analisarTermo(tokens: (string | number)[], index: number): [number, number] {
  let [left, i] = analisarFator(tokens, index);

  while (i < tokens.length && (tokens[i] === '*' || tokens[i] === '/')) {
    const op = tokens[i] as string;
    const [right, nextI] = analisarFator(tokens, i + 1);
    left = op === '*' ? left * right : right !== 0 ? left / right : 0;
    i = nextI;
  }

  return [left, i];
}

function analisarFator(tokens: (string | number)[], index: number): [number, number] {
  if (index >= tokens.length) return [0, index];

  const token = tokens[index];

  // Número
  if (typeof token === 'number') {
    return [token, index + 1];
  }

  // Parêntese
  if (token === '(') {
    const [result, i] = analisarExpressao(tokens, index + 1);
    // Saltar o ')'
    return [result, i + 1];
  }

  return [0, index];
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
  comprimentoBarra: number = 6000,
  kerfMm?: number
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
  const KERF = kerfMm ?? getKerf();

  for (const peca of pecas) {
    if (peca.comprimento <= 0 || peca.comprimento > comprimentoBarra) continue;

    // Find first bar that fits
    // Kerf model: each piece consumes its length + 1 kerf (the cut that separates it)
    let placed = false;
    for (const barra of barras) {
      const usado = barra.cortes.reduce((s, c) => s + c.comprimento + KERF, 0);
      if (usado + peca.comprimento + KERF <= comprimentoBarra) {
        barra.cortes.push(peca);
        const novoUsado = usado + peca.comprimento + KERF;
        barra.sobra_mm = comprimentoBarra - novoUsado;
        barra.aproveitamento_pct = Math.round((novoUsado / comprimentoBarra) * 100);
        placed = true;
        break;
      }
    }

    if (!placed) {
      const usadoNova = peca.comprimento + KERF;
      barras.push({
        barra_mm: comprimentoBarra,
        cortes: [peca],
        sobra_mm: comprimentoBarra - usadoNova,
        aproveitamento_pct: Math.round((usadoNova / comprimentoBarra) * 100),
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
 * Calcula dimensões de vidro por folha conforme tipologia.
 * Folgas are loaded from FormulaEngine config (configurable per manufacturer line).
 */
export function calcularVidros(
  tipo: string,
  largura: number,
  altura: number,
  folhas: number,
  linhaKey?: string
): ItemVidro[] {
  const t = (tipo || '').toLowerCase();
  const nf = Math.max(1, folhas || 2);
  const folga: FolgaConfig = getFolgaConfig(tipo, linhaKey);

  if (t === 'correr' || t === 'correr_2f' || t === 'correr_4f') {
    const f = t === 'correr_4f' ? 4 : nf;
    const vidL = Math.max(1, Math.round(largura / f - folga.folga_vidro_largura));
    const vidA = Math.max(1, Math.round(altura - folga.folga_vidro_altura));
    return [{
      descricao: `Vidro folha correr (${f}F)`,
      largura_mm: vidL,
      altura_mm: vidA,
      quantidade: f,
      area_m2: Math.round((vidL * vidA * f) / 1_000_000 * 100) / 100,
    }];
  }
  if (t === 'fixo') {
    const vidL = Math.max(1, Math.round(largura - folga.folga_vidro_largura));
    const vidA = Math.max(1, Math.round(altura - folga.folga_vidro_altura));
    return [{
      descricao: 'Vidro fixo',
      largura_mm: vidL,
      altura_mm: vidA,
      quantidade: 1,
      area_m2: Math.round((vidL * vidA) / 1_000_000 * 100) / 100,
    }];
  }
  if (t === 'basculante') {
    const vidL = Math.max(1, Math.round(largura - folga.folga_vidro_largura));
    const vidA = Math.max(1, Math.round(altura - folga.folga_vidro_altura));
    return [{
      descricao: 'Vidro basculante',
      largura_mm: vidL,
      altura_mm: vidA,
      quantidade: 1,
      area_m2: Math.round((vidL * vidA) / 1_000_000 * 100) / 100,
    }];
  }
  if (t === 'maxim-ar' || t === 'maximar') {
    const numFolhasCalc = Math.max(1, Math.floor(altura / 300));
    const vidL = Math.max(1, Math.round(largura - folga.folga_vidro_largura));
    const vidA = Math.max(1, Math.round((altura - folga.folga_vidro_altura) / numFolhasCalc - 20));
    return [{
      descricao: `Vidro maxim-ar (${numFolhasCalc}F)`,
      largura_mm: vidL,
      altura_mm: vidA,
      quantidade: numFolhasCalc,
      area_m2: Math.round((vidL * vidA * numFolhasCalc) / 1_000_000 * 100) / 100,
    }];
  }
  if (t === 'porta' || t.includes('porta')) {
    const vidL = Math.max(1, Math.round(largura / nf - folga.folga_vidro_largura));
    const vidA = Math.max(1, Math.round(altura - folga.folga_vidro_altura));
    return [{
      descricao: `Vidro porta (${nf}F)`,
      largura_mm: vidL,
      altura_mm: vidA,
      quantidade: nf,
      area_m2: Math.round((vidL * vidA * nf) / 1_000_000 * 100) / 100,
    }];
  }
  // Genérico
  const vidL = Math.max(1, Math.round(largura / nf - folga.folga_vidro_largura));
  const vidA = Math.max(1, Math.round(altura - folga.folga_vidro_altura));
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
    const numFolhasHw = Math.max(1, Math.floor(altura / 300));
    return [
      { nome: 'Barra de articulação (varão)', quantidade: numFolhasHw, unidade: 'un' },
      { nome: 'Gancho de fixação', quantidade: numFolhasHw * 2, unidade: 'un' },
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
