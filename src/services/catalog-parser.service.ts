/**
 * CatalogParserService — Extração de perfis de alumínio de PDFs/CSVs
 * 100% local, sem API externa. Usa padrões regex inteligentes.
 */

export interface ParsedPerfil {
  codigo: string;
  nome: string;
  tipo: string;
  peso_kg_m: number | null;
  espessura_mm: number | null;
}

export interface ParsedModelo {
  codigo: string;
  nome: string;
  tipo: string;
  descricao: string | null;
}

export interface CatalogParseResult {
  perfis: ParsedPerfil[];
  modelos: ParsedModelo[];
  fabricante: string;
  linhasIgnoradas: number;
  confianca: number; // 0-1
}

// ─── Padrões de código de perfil ──────────────────────────────────────────────
// Exemplos: A1234, PRF-456, 200.10, H-45, 1.1.4.01, AL123456
const CODIGO_PATTERNS = [
  /\b([A-Z]{1,4}[-.]?\d{2,6}(?:[-/]\w{1,4})?)\b/g,           // A1234, PRF-456, H-45-X
  /\b(\d{1,4}\.\d{1,4}(?:\.\d{1,4})*)\b/g,                   // 1.1.4.01 (formato numérico hierárquico)
  /\b(\d{4,8})\b/g,                                            // 12345678 (códigos numéricos puros)
];

// ─── Padrões de peso ─────────────────────────────────────────────────────────
const PESO_PATTERNS = [
  /(\d+[.,]\d{1,4})\s*kg\/m/gi,                  // 0,450 kg/m
  /peso[:\s]+(\d+[.,]\d{1,4})/gi,                 // peso: 0.450
  /(\d+[.,]\d{1,4})\s*g\/m/gi,                    // gramas por metro → converter
  /(\d+[.,]\d{1,4})\s*kg/gi,                      // 0,450 kg
  /\bw\s*=\s*(\d+[.,]\d{1,4})/gi,                 // W = 0.450 (peso linear)
  // Nota: extração de decimal colunar isolado é feita por extractDadosColunares()
];

// ─── Padrões de espessura ────────────────────────────────────────────────────
const ESPESSURA_PATTERNS = [
  /esp(?:essura)?[.:\s]+(\d+[.,]\d*)\s*mm/gi,     // espessura: 1,4mm
  /(\d+[.,]\d*)\s*mm\s+(?:esp|parede|wall)/gi,    // 1,4mm esp
  /e\s*=\s*(\d+[.,]\d*)/gi,                       // e = 1,4
  /esp(?:essura)?\s*(?:parede\s*)?[=:]\s*(\d+[.,]\d*)/gi, // esp parede = 1,4
  /\b(\d[.,]\d{1,2})\s*mm\b/gi,                   // 1,4 mm (número pequeno com mm)
  /\bt(?:hickness)?\s*=\s*(\d+[.,]\d*)/gi,        // t = 1,4 ou thickness = 1,4
];

// ─── Palavras-chave de tipo ───────────────────────────────────────────────────
const TIPO_KEYWORDS: Record<string, string[]> = {
  marco: ['marco', 'frame', 'caixilho'],
  folha: ['folha', 'wing', 'sash', 'batente'],
  trilho: ['trilho', 'guia', 'track', 'rail', 'calha'],
  veneziana: ['veneziana', 'persiana', 'shutter', 'louver'],
  estrutural: ['estrutural', 'reforço', 'structural', 'reinforc'],
  acabamento: ['arremate', 'acabamento', 'trim', 'cover', 'tampa'],
  janela: ['janela', 'window', 'janel'],
  porta: ['porta', 'door'],
  complemento: ['complemento', 'acessório', 'accesso', 'plug', 'cap'],
};

// ─── Palavras-chave de modelo de janela ──────────────────────────────────────
const MODELO_KEYWORDS = [
  'janela', 'porta', 'correr', 'basculante', 'projetante',
  'maxim-ar', 'maximar', 'guilhotina', 'pivotante', 'camarão',
  'window', 'door', 'sliding', 'casement', 'awning',
];

function normalizeFloat(s: string): number {
  // Remove separador de milhar (ponto ou espaço antes da vírgula), depois normaliza vírgula decimal
  return parseFloat(s.replace(/\.(?=\d{3})/g, '').replace(',', '.'));
}

function detectTipo(text: string): string {
  const lower = text.toLowerCase();
  for (const [tipo, keywords] of Object.entries(TIPO_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return tipo;
  }
  return 'perfil';
}

function extractPeso(text: string): number | null {
  // Padrões explícitos com unidade (mais confiáveis)
  for (const pattern of PESO_PATTERNS.slice(0, 5)) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      let val = normalizeFloat(match[1]);
      if (/g\/m/i.test(match[0])) val = val / 1000;
      if (val >= 0.05 && val < 50) return Math.round(val * 10000) / 10000;
    }
  }
  return null;
}

function extractEspessura(text: string): number | null {
  for (const pattern of ESPESSURA_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      const val = normalizeFloat(match[1]);
      if (val > 0 && val < 100) return val;
    }
  }
  return null;
}

/**
 * Extração colunar inteligente — para catálogos tabulares sem unidades explícitas.
 *
 * Heurística baseada em física dos perfis de alumínio:
 *   - Espessura de parede: 0,5 mm a 10 mm, tipicamente 1-2 casas decimais (1,4 / 2,0)
 *   - Peso linear:  0,05 kg/m a 10 kg/m, tipicamente 3 casas decimais (0,542 / 1,237)
 *
 * Diferenciador principal: número de casas decimais.
 * 3+ casas → peso | 1-2 casas no range 0,5-10 → espessura
 */
function extractDadosColunares(
  line: string,
  codigo: string,
): { peso: number | null; espessura: number | null } {
  // Limpar código, letras e dados técnicos de seção (Jx, Wx, Ix...)
  const limpo = line
    .replace(new RegExp(codigo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), ' ')
    .replace(/[IJWSA]x?[xt]?\s*=\s*[\d\s]+(?:mm\d*)?/gi, ' ')
    .replace(/\b\d[\d ]{4,}\b/g, ' ') // números grandes com separador europeu
    .replace(/[a-zA-ZÀ-ÿ/=]+/g, ' ');

  // Coletar todos os decimais remanescentes
  const matches = [...limpo.matchAll(/(\d+[.,]\d+)/g)];
  const numeros = matches
    .map((m) => ({ raw: m[1], val: normalizeFloat(m[1]) }))
    .filter((n) => n.val > 0 && n.val < 200);

  let peso: number | null = null;
  let espessura: number | null = null;

  for (const { raw, val } of numeros) {
    const decimais = (raw.split(/[.,]/)[1] ?? '').length;

    if (decimais >= 3 && val >= 0.05 && val <= 10 && peso === null) {
      // 3+ casas decimais → peso linear (ex: 0,542 ou 1,237 kg/m)
      peso = Math.round(val * 10000) / 10000;
    } else if (decimais <= 2 && val >= 0.5 && val <= 10 && espessura === null) {
      // 1-2 casas decimais no range físico → espessura de parede (ex: 1,4 ou 2,0 mm)
      espessura = val;
    }
  }

  // Fallback: se ainda não separou, tentar por faixa (menos preciso)
  if (peso === null && espessura === null) {
    for (const { val } of numeros) {
      if (val >= 0.05 && val < 1.5 && peso === null) {
        peso = Math.round(val * 10000) / 10000;
      } else if (val >= 0.8 && val <= 15 && espessura === null) {
        espessura = val;
      }
    }
  }

  return { peso, espessura };
}

function extractCodigo(text: string): string | null {
  for (const pattern of CODIGO_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      const code = match[1];
      // Filtrar falsos positivos: anos, páginas, etc.
      if (/^(20\d{2}|19\d{2}|\d{1,2})$/.test(code)) continue;
      if (code.length >= 3) return code;
    }
  }
  return null;
}

/**
 * Estratégia 1: Linha a linha (CSV ou texto tabular)
 * Assume que cada linha tem: código, nome, [espessura], [peso]
 */
function parseLinhaALinha(text: string): ParsedPerfil[] {
  const lines = text.split(/\n|\r\n/).map((l) => l.trim()).filter(Boolean);
  const perfis: ParsedPerfil[] = [];
  const seenCodigos = new Set<string>();

  for (const line of lines) {
    // Ignorar cabeçalhos e linhas muito curtas
    if (line.length < 4) continue;
    if (/^(codigo|code|ref|item|descrição|peso|esp)/i.test(line)) continue;

    const codigo = extractCodigo(line);
    if (!codigo || seenCodigos.has(codigo)) continue;

    let peso = extractPeso(line);
    let espessura = extractEspessura(line);

    // Fallback colunar: detecta por casas decimais quando não há unidade explícita
    if (peso === null || espessura === null) {
      const colunar = extractDadosColunares(line, codigo);
      if (peso === null) peso = colunar.peso;
      if (espessura === null) espessura = colunar.espessura;
    }

    // Nome: tudo que não é o código, dados técnicos ou unidades
    const nome = line
      .replace(codigo, '')
      .replace(/\d+[.,]\d+\s*(?:kg\/m|g\/m|mm|kg|m)/gi, '')
      // Remover dados de seção técnica (Jx, Wx, Ix etc. com valores)
      .replace(/[IJWSA]x?[xt]?\s*=\s*[\d\s]+(?:mm\d*)?/gi, '')
      .replace(/\b\d[\d\s]{3,}\b/g, '') // números grandes (separador de milhar europeu)
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 80);

    seenCodigos.add(codigo);
    perfis.push({
      codigo,
      nome: nome || codigo,
      tipo: detectTipo(line),
      peso_kg_m: peso,
      espessura_mm: espessura,
    });
  }

  return perfis;
}

/**
 * Estratégia 2: Blocos (PDF com layout de catálogo)
 * Procura padrões código + dados em blocos de texto
 */
function parsePorBlocos(text: string): ParsedPerfil[] {
  const perfis: ParsedPerfil[] = [];
  const seenCodigos = new Set<string>();

  // Divide em blocos por código detectado
  const codePattern = /\b([A-Z]{1,4}[-.]?\d{2,6}(?:[-/]\w{1,4})?)\b/g;
  let match: RegExpExecArray | null;
  const positions: Array<{ code: string; index: number }> = [];

  while ((match = codePattern.exec(text)) !== null) {
    const code = match[1];
    if (!/^(20\d{2}|19\d{2}|\d{1,2})$/.test(code) && code.length >= 3) {
      positions.push({ code, index: match.index });
    }
  }

  for (let i = 0; i < positions.length; i++) {
    const { code, index } = positions[i];
    if (seenCodigos.has(code)) continue;

    const end = positions[i + 1]?.index ?? Math.min(index + 300, text.length);
    const bloco = text.slice(index, end);

    let peso = extractPeso(bloco);
    let espessura = extractEspessura(bloco);
    if (peso === null || espessura === null) {
      const colunar = extractDadosColunares(bloco, code);
      if (peso === null) peso = colunar.peso;
      if (espessura === null) espessura = colunar.espessura;
    }
    const nome = bloco
      .replace(code, '')
      .replace(/\d+[.,]\d+\s*(?:kg\/m|g\/m|mm|kg|m)/gi, '')
      .replace(/[IJWSA]x?[xt]?\s*=\s*[\d\s]+(?:mm\d*)?/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 80);

    seenCodigos.add(code);
    perfis.push({
      codigo: code,
      nome: nome || code,
      tipo: detectTipo(bloco),
      peso_kg_m: peso,
      espessura_mm: espessura,
    });
  }

  return perfis;
}

/**
 * Extrai modelos de janelas/portas do texto
 */
function parseModelos(text: string): ParsedModelo[] {
  const modelos: ParsedModelo[] = [];
  const seenCodigos = new Set<string>();
  const lines = text.split(/\n|\r\n/).filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();
    const isModelo = MODELO_KEYWORDS.some((kw) => lower.includes(kw));
    if (!isModelo) continue;

    const codigo = extractCodigo(line);
    if (!codigo || seenCodigos.has(codigo)) continue;

    seenCodigos.add(codigo);
    modelos.push({
      codigo,
      nome: line.replace(codigo, '').replace(/\s{2,}/g, ' ').trim().slice(0, 80) || codigo,
      tipo: lower.includes('porta') ? 'porta' : 'janela',
      descricao: line.slice(0, 120),
    });
  }

  return modelos;
}

function detectFabricante(text: string): string {
  const known = ['Hydro', 'Alumasa', 'Alcan', 'Alcoa', 'Novelis', 'CBCA', 'Tecnal', 'Braz'];
  for (const name of known) {
    if (text.toLowerCase().includes(name.toLowerCase())) return name;
  }
  // Tentar pegar primeira linha como fabricante
  const firstLine = text.split('\n').find((l) => l.trim().length > 3);
  return firstLine?.trim().slice(0, 40) ?? 'Desconhecido';
}

export const CatalogParserService = {
  /**
   * Parseia texto extraído de PDF/CSV e retorna perfis e modelos detectados.
   * Usa múltiplas estratégias e retorna a que encontrou mais itens.
   */
  parse(text: string): CatalogParseResult {
    const linhas = parseLinhaALinha(text);
    const blocos = parsePorBlocos(text);

    // Usa a estratégia que encontrou mais perfis
    const perfis = linhas.length >= blocos.length ? linhas : blocos;
    const modelos = parseModelos(text);
    const fabricante = detectFabricante(text);

    // Calcular confiança multi-dimensional:
    //   30% → base por ter perfis detectados
    //   10% → volume adequado (>= 5 perfis)
    //   35% → cobertura de peso (principal indicador de qualidade)
    //   25% → cobertura de espessura
    const comPeso = perfis.filter((p) => p.peso_kg_m !== null).length;
    const comEsp  = perfis.filter((p) => p.espessura_mm !== null).length;
    const confianca = perfis.length === 0
      ? 0
      : Math.min(
          0.30 +
          (perfis.length >= 5 ? 0.10 : perfis.length * 0.02) +
          (comPeso / perfis.length) * 0.35 +
          (comEsp  / perfis.length) * 0.25,
          1,
        );

    return {
      perfis: perfis.slice(0, 500), // limite de segurança
      modelos: modelos.slice(0, 200),
      fabricante,
      linhasIgnoradas: text.split('\n').length - perfis.length,
      confianca,
    };
  },
};
