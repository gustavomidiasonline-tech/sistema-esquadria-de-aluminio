/**
 * FormulaEngine — Motor unificado de fórmulas de esquadria
 *
 * Resolve os 3 dialetos de fórmulas (largura/L/H, mm/m) em um único engine.
 * Suporta folgas configuráveis por tipologia e linha de fabricante.
 *
 * Variáveis suportadas:
 *   largura, largura_total, L  → largura em mm
 *   altura, altura_total, H    → altura em mm
 *   folhas, num_folhas          → número de folhas
 *   folga_trilho, folga_marco, folga_vidro, kerf → parâmetros configuráveis
 */

// ─── Folga Configuration Types ──────────────────────────────────────

export interface FolgaConfig {
  /** Folga do trilho para folhas de correr (mm) */
  folga_trilho: number;
  /** Folga lateral do marco (mm) */
  folga_marco: number;
  /** Folga de vidro largura (mm) */
  folga_vidro_largura: number;
  /** Folga de vidro altura (mm) */
  folga_vidro_altura: number;
  /** Folga de sobreposição da folha (overlap, mm) */
  folga_sobreposicao: number;
  /** Espessura do disco de corte (mm) */
  kerf: number;
}

export interface FolgaConfigByType {
  correr_2f: FolgaConfig;
  correr_4f: FolgaConfig;
  fixo: FolgaConfig;
  basculante: FolgaConfig;
  maximar: FolgaConfig;
  porta: FolgaConfig;
  generico: FolgaConfig;
}

// ─── Default Folgas (industry standard) ─────────────────────────────

export const FOLGAS_PADRAO: FolgaConfigByType = {
  correr_2f: {
    folga_trilho: 3,
    folga_marco: 10,
    folga_vidro_largura: 70,
    folga_vidro_altura: 90,
    folga_sobreposicao: 30,
    kerf: 3,
  },
  correr_4f: {
    folga_trilho: 3,
    folga_marco: 10,
    folga_vidro_largura: 60,
    folga_vidro_altura: 90,
    folga_sobreposicao: 20,
    kerf: 3,
  },
  fixo: {
    folga_trilho: 0,
    folga_marco: 0,
    folga_vidro_largura: 50,
    folga_vidro_altura: 50,
    folga_sobreposicao: 0,
    kerf: 3,
  },
  basculante: {
    folga_trilho: 0,
    folga_marco: 0,
    folga_vidro_largura: 40,
    folga_vidro_altura: 40,
    folga_sobreposicao: 0,
    kerf: 3,
  },
  maximar: {
    folga_trilho: 0,
    folga_marco: 0,
    folga_vidro_largura: 30,
    folga_vidro_altura: 40,
    folga_sobreposicao: 0,
    kerf: 3,
  },
  porta: {
    folga_trilho: 3,
    folga_marco: 10,
    folga_vidro_largura: 70,
    folga_vidro_altura: 100,
    folga_sobreposicao: 30,
    kerf: 3,
  },
  generico: {
    folga_trilho: 3,
    folga_marco: 5,
    folga_vidro_largura: 60,
    folga_vidro_altura: 80,
    folga_sobreposicao: 10,
    kerf: 3,
  },
};

// ─── Type Resolution ────────────────────────────────────────────────

export function resolverTipo(tipo: string): keyof FolgaConfigByType {
  const t = (tipo || '').toLowerCase().replace(/[-\s]/g, '');
  if (t === 'correr4f') return 'correr_4f';
  if (t.includes('correr') || t === 'correr2f') return 'correr_2f';
  if (t === 'fixo') return 'fixo';
  if (t === 'basculante') return 'basculante';
  if (t === 'maximar' || t === 'maxim-ar' || t === 'maximar') return 'maximar';
  if (t.includes('porta')) return 'porta';
  return 'generico';
}

// ─── In-Memory Config Store ─────────────────────────────────────────

let _folgaOverrides: Partial<Record<string, FolgaConfigByType>> = {};

/**
 * Set folga overrides for a specific manufacturer line.
 * Key format: "fabricante:linha" (e.g., "alcoa:supreme")
 */
export function setFolgaConfig(linhaKey: string, config: Partial<FolgaConfigByType>): void {
  _folgaOverrides[linhaKey] = { ...FOLGAS_PADRAO, ...config } as FolgaConfigByType;
}

/**
 * Get folga config for a specific type, optionally for a manufacturer line.
 */
export function getFolgaConfig(tipo: string, linhaKey?: string): FolgaConfig {
  const tipoResolvido = resolverTipo(tipo);

  if (linhaKey && _folgaOverrides[linhaKey]) {
    return _folgaOverrides[linhaKey]![tipoResolvido] ?? FOLGAS_PADRAO[tipoResolvido];
  }

  return FOLGAS_PADRAO[tipoResolvido];
}

/**
 * Load folga configs from an array (e.g., fetched from Supabase folgas_config table)
 */
export function carregarFolgasDB(rows: Array<{
  linha_key: string;
  tipo: string;
  folga_trilho: number;
  folga_marco: number;
  folga_vidro_largura: number;
  folga_vidro_altura: number;
  folga_sobreposicao: number;
  kerf: number;
}>): void {
  _folgaOverrides = {};
  for (const row of rows) {
    const tipoKey = resolverTipo(row.tipo);
    if (!_folgaOverrides[row.linha_key]) {
      _folgaOverrides[row.linha_key] = { ...FOLGAS_PADRAO };
    }
    _folgaOverrides[row.linha_key]![tipoKey] = {
      folga_trilho: row.folga_trilho,
      folga_marco: row.folga_marco,
      folga_vidro_largura: row.folga_vidro_largura,
      folga_vidro_altura: row.folga_vidro_altura,
      folga_sobreposicao: row.folga_sobreposicao,
      kerf: row.kerf,
    };
  }
}

/** Clear all overrides (for testing) */
export function resetFolgaConfig(): void {
  _folgaOverrides = {};
}

// ─── Unified Formula Evaluator ──────────────────────────────────────

export interface FormulaContext {
  largura: number;       // mm
  altura: number;        // mm
  folhas: number;
  tipo?: string;
  linhaKey?: string;     // "fabricante:linha" for folga lookup
}

/**
 * Evaluate a formula string with full variable support.
 * Supports all 3 dialects: largura/L/H, num_folhas/folhas, plus folga variables.
 */
export function avaliarFormulaUnificada(formula: string, ctx: FormulaContext): number {
  try {
    const { largura, altura, folhas } = ctx;
    const nf = folhas || 2;
    const folga = ctx.tipo ? getFolgaConfig(ctx.tipo, ctx.linhaKey) : FOLGAS_PADRAO.generico;

    // Replace variables — longest names first to avoid partial matches
    let expr = formula
      // Folga variables
      .replace(/folga_vidro_largura/g, String(folga.folga_vidro_largura))
      .replace(/folga_vidro_altura/g, String(folga.folga_vidro_altura))
      .replace(/folga_sobreposicao/g, String(folga.folga_sobreposicao))
      .replace(/folga_trilho/g, String(folga.folga_trilho))
      .replace(/folga_marco/g, String(folga.folga_marco))
      .replace(/\bkerf\b/g, String(folga.kerf))
      // Dimension variables
      .replace(/largura_total/g, String(largura))
      .replace(/altura_total/g, String(altura))
      .replace(/num_folhas/g, String(nf))
      .replace(/largura/g, String(largura))
      .replace(/altura/g, String(altura))
      .replace(/folhas/g, String(nf))
      // Short aliases (L, H) — word boundary to avoid replacing inside words
      .replace(/\bL\b/g, String(largura))
      .replace(/\bH\b/g, String(altura));

    // Safe eval: only allow numbers, operators, parentheses, spaces, decimals
    if (!/^[\d\s+\-*/().]+$/.test(expr)) {
      console.warn('[FormulaEngine] Formula inválida:', formula, '->', expr);
      return 0;
    }

    const result = evaluarExpressaoSegura(expr);
    const value = Number(result);
    if (!isFinite(value)) return 0;
    return Math.round(value);
  } catch (e) {
    console.warn('[FormulaEngine] Erro ao avaliar fórmula:', formula, e);
    return 0;
  }
}

/**
 * Evaluate a formula in meters (for BOM service compatibility).
 * Converts largura/altura from mm to meters before evaluation.
 */
export function avaliarFormulaMetros(formula: string, larguraMm: number, alturaMm: number): number {
  try {
    const l = larguraMm / 1000;
    const a = alturaMm / 1000;

    const expr = formula
      .replace(/largura/g, String(l))
      .replace(/altura/g, String(a))
      .replace(/\bL\b/g, String(l))
      .replace(/\bH\b/g, String(a));

    if (!/^[\d\s+\-*/().]+$/.test(expr)) return 0;

    const result = evaluarExpressaoSegura(expr);
    const value = Number(result);
    return isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

// ─── Unified Kerf Constant ──────────────────────────────────────────

/** Get kerf for a given type and optional manufacturer line */
export function getKerf(tipo?: string, linhaKey?: string): number {
  if (!tipo) return 3; // default
  return getFolgaConfig(tipo, linhaKey).kerf;
}

// ─── Safe Expression Evaluator (CSP-compliant) ──────────────────────

/** Avaliador seguro de expressões matemáticas (CSP-safe, sem Function/eval) */
function evaluarExpressaoSegura(expr: string): number {
  try {
    const tokens = tokenizar(expr);
    const [resultado] = analisarExpressao(tokens, 0);
    return resultado;
  } catch {
    return 0;
  }
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
