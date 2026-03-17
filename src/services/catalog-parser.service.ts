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
  /(?:^|\s)(0[.,]\d{2,4}|\d[.,]\d{3,4})(?=\s|$)/gm, // decimal isolado tipo 0,450 ou 1,237 (coluna de peso)
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
  return parseFloat(s.replace(',', '.'));
}

function detectTipo(text: string): string {
  const lower = text.toLowerCase();
  for (const [tipo, keywords] of Object.entries(TIPO_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return tipo;
  }
  return 'perfil';
}

function extractPeso(text: string): number | null {
  // Padrões explícitos primeiro (mais confiáveis)
  const explicit = PESO_PATTERNS.slice(0, 4);
  for (const pattern of explicit) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      let val = normalizeFloat(match[1]);
      if (/g\/m/i.test(match[0])) val = val / 1000;
      if (val > 0 && val < 50) return Math.round(val * 10000) / 10000;
    }
  }

  // Padrão W= para peso linear
  const wPattern = PESO_PATTERNS[4];
  wPattern.lastIndex = 0;
  const wMatch = wPattern.exec(text);
  if (wMatch) {
    const val = normalizeFloat(wMatch[1]);
    if (val > 0 && val < 50) return Math.round(val * 10000) / 10000;
  }

  // Coluna isolada: decimal tipo 0,450 ou 1,237 — comum em catálogos tabulares
  // Só usar se a linha contém um código de perfil (não linha de cabeçalho)
  const colPattern = PESO_PATTERNS[5];
  colPattern.lastIndex = 0;
  const colMatch = colPattern.exec(text);
  if (colMatch) {
    const val = normalizeFloat(colMatch[1]);
    // Faixa de peso real de perfil de alumínio: 0,05 a 10 kg/m
    if (val >= 0.05 && val <= 10) return Math.round(val * 10000) / 10000;
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

    const peso = extractPeso(line);
    const espessura = extractEspessura(line);

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

    const peso = extractPeso(bloco);
    const espessura = extractEspessura(bloco);
    const nome = bloco
      .replace(code, '')
      .replace(/\d+[.,]\d+\s*(?:kg\/m|g\/m|mm|kg|m)/gi, '')
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

    // Calcular confiança baseada na qualidade dos dados
    const comPeso = perfis.filter((p) => p.peso_kg_m !== null).length;
    const confianca = perfis.length === 0
      ? 0
      : Math.min(0.5 + (comPeso / perfis.length) * 0.5, 1);

    return {
      perfis: perfis.slice(0, 500), // limite de segurança
      modelos: modelos.slice(0, 200),
      fabricante,
      linhasIgnoradas: text.split('\n').length - perfis.length,
      confianca,
    };
  },
};
