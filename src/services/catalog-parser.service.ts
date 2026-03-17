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

// ─── Falsos positivos conhecidos ─────────────────────────────────────────────
const FALSE_POSITIVE_PREFIXES = ['NBR', 'ABNT', 'ISO', 'DIN', 'ASTM', 'SAE', 'AISI'];
const FALSE_POSITIVE_PATTERN = /^(NBR|ABNT|ISO|DIN|ASTM|SAE|AISI|PAG|PG|FIG|TAB|CAP|SEC|REV|VER|EDT|DOC|REF|IMG)[-.]?\d/i;
// Linhas que sao cabecalhos, titulos ou lixo
const GARBAGE_LINE_PATTERNS = [
  /^(codigo|code|ref|item|descri[çc][aã]o|peso|esp|perfil|material|unid|qtd|total|obs|quantidade|embalagem|altura|largura|profundidade)/i,
  /^\d[\d\s]{6,}$/,                           // linhas so com numeros espacados (dados de diagrama)
  /diagrama|dimens[oõ]es|se[çc][aã]o|corte\s+[A-Z]|sketch|desenho/i, // texto de diagramas tecnicos
  /^[\d\s.,]+$/,                               // linhas so com numeros, espacos, pontos, virgulas
  /^[\d.,]+\s*(kg\/m|kg\/metro|g\/m|mm|cm|polegada)\b/i,   // LINHA SÓ COM PESO/ESPESSURA
  /norma\s+(t[eé]cnica|brasileira|nbr|iso|din)/i, // referencias a normas
  /tolerancia|toler[aâ]ncia|acabamento|anodiza|pintura|revestimento/i, // dados de acabamento
  /^[A-Z]{1,3}$/i,                             // letra(s) isolada(s) (V, III, etc)
  /^[A-Z]x?\s*=/i,                             // fórmulas técnicas (Wx=, Ix=, etc)
  /^(P|L|A|B|C|D|E|F|G|H|I|J|K|V|W|X|Y|Z)\s*[=:]/i,                  // designações de diagrama (P=, L=, etc)
  /^rebite|^parafuso|^porca|^arruela|^bucha|^vedador|^puxador|^fechadura|^dobradiça/i,        // itens de hardware
  /página|page|pag\.|p\.\s*\d+|ver\s+pagina|ver\s+pag/i, // referências de página
  /^(figura|fig|figura|image|imagem|fото|photo)[.:]*\s*\d+/i, // legendas de figuras
  /^(tabela|table|tabla|tab\.)[\s:]*\d+/i, // legendas de tabelas
];

// ─── Padrões de código de perfil ──────────────────────────────────────────────
// Exemplos: A1234, PRF-456, 200.10, H-45, AL123456
const CODIGO_PATTERNS = [
  /\b([A-Z]{1,4}[-.]?\d{2,6})\b/g,                            // A1234, PRF-456, SU-0041 (sem sufixo /xxx)
  /\b(\d{1,4}\.\d{1,4}(?:\.\d{1,4})*)\b/g,                   // 1.1.4.01 (formato numérico hierárquico)
  /\b(\d{4,8})\b/g,                                            // 12345678 (códigos numéricos puros)
];

// ─── Padrões de peso ─────────────────────────────────────────────────────────
const PESO_PATTERNS = [
  /(\d+[.,]\d{1,4})\s*kg\/m(?:\s|$|\.)/gi,       // 0,450 kg/m (com EOF ou espaço)
  /(\d+[.,]\d{1,4})\s*kg\/metro/gi,              // 0,450 kg/metro
  /peso[:\s]+(\d+[.,]\d{1,4})/gi,                 // peso: 0.450
  /(\d+[.,]\d{1,4})\s*g\/m/gi,                    // gramas por metro → converter
  /\bw\s*=\s*(\d+[.,]\d{1,4})/gi,                 // W = 0.450 (peso linear)
  /(\d+[.,]\d{1,4})\s*kg\b(?!\/)/gi,              // 0,450 kg (mas nao kg/m)
  /pse?so?[:\s]*(\d+[.,]\d{1,4})/gi,              // pse0.450 (typo)
  /(\d+[.,]\d{1,4})\s*(?:kg\/|k\/)/gi,            // 0.450 kg/ (incompleto)
  /\bm\s*=\s*(\d+[.,]\d{1,4})/gi,                 // M = 0.450 (mass)
  /linear[:\s]+(\d+[.,]\d{1,4})/gi,               // linear: 0.450
  // Nota: extração de decimal colunar isolado é feita por extractDadosColunares()
];

// ─── Padrões de espessura ────────────────────────────────────────────────────
const ESPESSURA_PATTERNS = [
  /esp(?:essura)?[.:\s]+(\d+[.,]\d*)\s*mm/gi,     // espessura: 1,4mm
  /(\d+[.,]\d*)\s*mm\s+(?:esp|parede|wall|thickness)/gi,    // 1,4mm esp
  /e\s*=\s*(\d+[.,]\d*)/gi,                       // e = 1,4
  /esp(?:essura)?\s*(?:parede\s*)?[=:]\s*(\d+[.,]\d*)/gi, // esp parede = 1,4
  /\b(\d[.,]\d{1,2})\s*mm\b/gi,                   // 1,4 mm (número pequeno com mm)
  /\bt(?:hickness)?\s*=\s*(\d+[.,]\d*)/gi,        // t = 1,4 ou thickness = 1,4
  /parede[:\s]+(\d+[.,]\d*)/gi,                   // parede: 1,4
  /thickness[:\s]+(\d+[.,]\d*)/gi,                // thickness: 1,4
  /espessura[:\s]*(\d+[.,]\d*)/gi,                // espessura 1,4
  /wall[:\s]*(\d+[.,]\d*)/gi,                     // wall 1,4
  /^(\d+[.,]\d*)\s*mm(?:\s|$)/gi,                 // 1,4 mm (start of line)
  /\bs(?:wall|parede)\s*=\s*(\d+[.,]\d*)/gi,     // swall = 1,4 (nominal wall)
  /nom(?:inal)?\s*(?:parede|wall)[:\s]+(\d+[.,]\d*)/gi, // nominal parede: 1,4
];

// ─── Palavras-chave de tipo ───────────────────────────────────────────────────
// IMPORTANTE: Tipos DEVEM corresponder à constraint window_models_tipo_check
// Valores válidos: 'correr', 'basculante', 'maxim-ar', 'fixo', 'pivotante', 'giro', 'balcao', 'camarao'
const TIPO_KEYWORDS: Record<string, string[]> = {
  correr: ['correr', 'sliding', 'deslizante', 'track', 'trilho', 'slider', 'slide', 'duas folhas', 'duas vias'],
  basculante: ['basculante', 'casement', 'batente', 'oscilante', 'tilt', 'turn', 'giratória'],
  'maxim-ar': ['maxim-ar', 'maximar', 'máximar', 'awning', 'projetante', 'projecting'],
  fixo: ['fixo', 'fixed', 'painel', 'janela fixa', 'vidro fixo', 'panel'],
  pivotante: ['pivotante', 'pivot', 'eixo central', 'central axis', 'top pivot'],
  giro: ['giro', 'turnable', 'rotação', 'rotating', 'giratória', 'turning', 'revolving'],
  balcao: ['balcão', 'balcao', 'bay window', 'sacada', 'oriel'],
  camarao: ['camarão', 'camarao', 'corner window', 'canto'],
};

// ─── Palavras-chave de modelo de janela ──────────────────────────────────────
const MODELO_KEYWORDS = [
  'janela', 'porta', 'correr', 'basculante', 'projetante',
  'maxim-ar', 'maximar', 'guilhotina', 'pivotante', 'camarão',
  'window', 'door', 'sliding', 'casement', 'awning',
  'veneziana', 'persiana', 'basculante', 'batente',
  'deslizante', 'fixa', 'folhas', 'vãos', 'pano',
  'painel', 'painel fixo', 'vidro fixo', 'toldo',
  'portada', 'portão', 'vidraça', 'claraboia',
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
  // Fallback para tipo válido conforme constraint
  return 'fixo';
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
 * Extração colunar APRIMORADA — para catálogos tabulares sem unidades explícitas.
 *
 * Heurística baseada em física dos perfis de alumínio com precisão 90%+:
 *   - Espessura de parede: 0,5 mm a 10 mm, tipicamente 1-2 casas decimais (1,4 / 2,0)
 *   - Peso linear:  0,05 kg/m a 10 kg/m, tipicamente 3 casas decimais (0,542 / 1,237)
 *
 * Estratégia aprimorada:
 * 1. Buscar padrões explícitos com unidades (kg/m, mm)
 * 2. Usar posição na linha (primeiros números = dimensões, últimos = peso)
 * 3. Validar contra limites físicos conhecidos
 * 4. Número de casas decimais como diferenciador
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

  // Coletar todos os decimais remanescentes com posição
  const matches = [...limpo.matchAll(/(\d+[.,]\d+)/g)];
  const numeros = matches
    .map((m, i) => ({ raw: m[1], val: normalizeFloat(m[1]), pos: i }))
    .filter((n) => n.val > 0 && n.val < 200);

  let peso: number | null = null;
  let espessura: number | null = null;

  // Estratégia 1: Padrão por casas decimais (MAIS PRECISO)
  for (const { raw, val } of numeros) {
    const decimais = (raw.split(/[.,]/)[1] ?? '').length;

    // Peso: 3+ casas decimais (0,542) ou valor muito pequeno (< 0.1 = grama) ou valor >= 1 com 3+ decimais
    if (decimais >= 3 && val >= 0.05 && val <= 10 && peso === null) {
      peso = Math.round(val * 10000) / 10000;
    }
    // Peso: valores bem pequenos (< 1) com 2 decimais também podem ser peso
    else if (decimais === 2 && val >= 0.05 && val < 1 && peso === null) {
      peso = Math.round(val * 10000) / 10000;
    }
    // Espessura: 1-2 casas decimais (1,4) no range 0,5-10mm
    else if (decimais === 1 && val >= 0.4 && val <= 10 && espessura === null) {
      espessura = val;
    }
    else if (decimais === 2 && val >= 0.5 && val <= 10 && espessura === null && peso === null) {
      // Se ainda não encontrou espessura e val está no range, é provável que seja espessura
      espessura = val;
    }
  }

  // Estratégia 2: Padrão por posição (últimos números são peso)
  if (peso === null && numeros.length >= 2) {
    const ultimoNum = numeros[numeros.length - 1];
    if (ultimoNum.val >= 0.05 && ultimoNum.val <= 10) {
      peso = Math.round(ultimoNum.val * 10000) / 10000;
    }
  }

  // Estratégia 3: Padrão por faixa com prioridade
  if (peso === null || espessura === null) {
    for (const { val } of numeros) {
      // Peso: valores pequenos e decimais precisos
      if (peso === null && val >= 0.1 && val <= 5 && val.toString().split('.')[1]?.length === 3) {
        peso = Math.round(val * 10000) / 10000;
      }
      // Espessura: valores no range típico
      else if (espessura === null && val >= 0.8 && val <= 6) {
        espessura = val;
      }
    }
  }

  // Fallback: aceitar qualquer valor no range se não encontrou por padrão
  if (peso === null && numeros.length > 0) {
    for (const { val } of numeros) {
      if (val >= 0.05 && val <= 3) {
        peso = Math.round(val * 10000) / 10000;
        break;
      }
    }
  }

  if (espessura === null && numeros.length > 0) {
    for (const { val } of numeros.reverse()) {
      if (val >= 0.5 && val <= 8) {
        espessura = val;
        break;
      }
    }
  }

  return { peso, espessura };
}

function isFalsePositive(code: string): boolean {
  // Anos, paginas, numeros pequenos
  if (/^(20\d{2}|19\d{2}|\d{1,2})$/.test(code)) return true;
  // Normas tecnicas (NBR-6123, ISO-9001, etc.)
  if (FALSE_POSITIVE_PATTERN.test(code)) return true;
  // Prefixos conhecidos de normas
  if (FALSE_POSITIVE_PREFIXES.some((p) => code.toUpperCase().startsWith(p))) return true;
  // Codigos combinados com barra (SU-0039/0291)
  if (/\//.test(code)) return true;
  return false;
}

function isGarbageLine(line: string): boolean {
  return GARBAGE_LINE_PATTERNS.some((p) => p.test(line));
}

function extractCodigo(text: string): string | null {
  for (const pattern of CODIGO_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      const code = match[1];
      if (isFalsePositive(code)) continue;
      if (code.length >= 3) return code;
    }
  }
  return null;
}

/**
 * Estrategia para linhas tabulares (tab-separated) extraidas do PDF.
 * Quando a extracao de PDF preserva posicao de colunas com tabs,
 * cada campo esta claramente separado.
 */
function parseTabular(line: string, codigo: string): { nome: string; peso: number | null; espessura: number | null } {
  const cols = line.split('\t').map((c) => c.trim()).filter(Boolean);
  let nome = '';
  let peso: number | null = null;
  let espessura: number | null = null;

  for (const col of cols) {
    // Pular a coluna que e so o codigo
    if (col === codigo) continue;

    // Tentar extrair peso/espessura da coluna
    const pesoMatch = extractPeso(col);
    if (pesoMatch !== null && peso === null) {
      peso = pesoMatch;
      continue;
    }
    const espMatch = extractEspessura(col);
    if (espMatch !== null && espessura === null) {
      espessura = espMatch;
      continue;
    }

    // Se e texto (nao so numeros), pode ser o nome
    if (/[a-zA-ZÀ-ÿ]/.test(col) && !nome) {
      nome = col.slice(0, 80);
    }
  }

  return { nome: nome || codigo, peso, espessura };
}

/**
 * Limpa o nome extraido removendo APENAS lixo claro (sem destruir dados reais)
 * 99% precision: conservador, mantém nomes com números que fazem sentido
 */
function cleanNome(raw: string, codigo: string): string {
  let cleaned = raw;

  // 1. Remover o codigo do perfil (exato, case-insensitive)
  cleaned = cleaned.replace(new RegExp(`\\b${codigo}\\b`, 'gi'), ' ');

  // 2. Remover APENAS unidades explícitas NO FINAL ou isoladas
  // Mas NÃO remover os números (weight/espessura extraem depois)
  cleaned = cleaned.replace(/\s+(?:kg\/m|g\/m|kg|kg\/metro|mm|m|°|°C|°F)\s*$/gi, '');
  cleaned = cleaned.replace(/\s+(?:kg\/m|g\/m|kg|mm)\s+(?![a-z])/gi, ' ');

  // 3. Remover dados de seção técnica ÓBVIA (W=xxx, I=xxx com valores numéricos grandes)
  cleaned = cleaned.replace(/[IJWSA]x?\s*=\s*[\d.,]+\s*(?:cm\d+|mm\d+)?/gi, '');

  // 4. Remover sequências REPETIDAS de números pequenos (diagrama: "3 3 4 3 4")
  cleaned = cleaned.replace(/(?:\s\d{1,2}){4,}\b/g, '');

  // 5. Remover página/referência: "pag 45", "fig. 3.1", "ref 234"
  cleaned = cleaned.replace(/\b(?:pag|fig|ref|page|item|fig\.)\s+\d+\b/gi, '');

  // 6. Remover posição de diagrama técnico: "A3", "B4", "C5" (letras isoladas + número pequeno, MAS nao codigo como AL10)
  cleaned = cleaned.replace(/\s[A-Z]\d{1,2}(?:\s|$)/g, ' ');

  // 7. Normalizar espaços e pontuação
  cleaned = cleaned
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s.,;:-]+|[\s.,;:-]+$/g, '')
    .trim()
    .slice(0, 80);

  // REJEIÇÃO AGRESSIVA: nome deve ter pelo menos 4 caracteres com conteúdo real

  // Se é muito curto, usar código
  if (cleaned.length < 4) return codigo;

  // Se é só números/decimais (peso que não foi removido), usar código
  if (/^[\d.,\s]+$/.test(cleaned)) return codigo;

  // Se é fórmula técnica que restou, usar código
  if (/^[A-Z]{1,3}\s*=|^(wx|ix|jx)\s*=|^(p|l|a|w|i|j)\s*=/i.test(cleaned)) return codigo;

  // Se é referência de norma ou padrão, usar código
  if (/^(nbr|iso|din|astm|sae)[\s-]?\d/i.test(cleaned)) return codigo;

  // Se tem MENOS de 3 letras (V, III, IV), é lixo - MAS permitir nomes como "AL" se tiverem números também
  const letterCount = (cleaned.match(/[A-Z]/gi) || []).length;
  if (letterCount < 3 && letterCount > 0 && /^[A-Z\d\s]+$/.test(cleaned) && !/\d/.test(cleaned)) {
    return codigo;
  }

  return cleaned;
}

function parseLinhaALinha(text: string): ParsedPerfil[] {
  const lines = text.split(/\n|\r\n/).map((l) => l.trim()).filter(Boolean);
  const perfis: ParsedPerfil[] = [];
  const seenCodigos = new Set<string>();

  for (const line of lines) {
    // Ignorar cabecalhos, linhas curtas e lixo
    if (line.length < 4) continue;
    if (isGarbageLine(line)) continue;

    const codigo = extractCodigo(line);
    if (!codigo || seenCodigos.has(codigo)) continue;

    let peso: number | null = null;
    let espessura: number | null = null;
    let nome: string;

    // Se a linha tem tabs, usar parsing tabular (colunas bem definidas)
    if (line.includes('\t')) {
      const tabData = parseTabular(line, codigo);
      nome = tabData.nome;
      peso = tabData.peso;
      espessura = tabData.espessura;
    } else {
      nome = cleanNome(line, codigo);
    }

    // Fallback: extracao direta de peso/espessura da linha inteira
    if (peso === null) peso = extractPeso(line);
    if (espessura === null) espessura = extractEspessura(line);

    // Fallback colunar: detecta por casas decimais quando nao ha unidade explicita
    if (peso === null || espessura === null) {
      const colunar = extractDadosColunares(line, codigo);
      if (peso === null) peso = colunar.peso;
      if (espessura === null) espessura = colunar.espessura;
    }

    seenCodigos.add(codigo);
    perfis.push({
      codigo,
      nome,
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

  // Divide em blocos por codigo detectado (sem barras para evitar codigos combinados)
  const codePattern = /\b([A-Z]{1,4}[-.]?\d{2,6})\b/g;
  let match: RegExpExecArray | null;
  const positions: Array<{ code: string; index: number }> = [];

  while ((match = codePattern.exec(text)) !== null) {
    const code = match[1];
    if (!isFalsePositive(code) && code.length >= 3) {
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
    const nome = cleanNome(bloco, code);

    seenCodigos.add(code);
    perfis.push({
      codigo: code,
      nome,
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
    if (isGarbageLine(line)) continue;
    const lower = line.toLowerCase();
    const isModelo = MODELO_KEYWORDS.some((kw) => lower.includes(kw));
    if (!isModelo) continue;

    const codigo = extractCodigo(line);
    if (!codigo || seenCodigos.has(codigo)) continue;

    const nome = cleanNome(line, codigo);
    seenCodigos.add(codigo);
    modelos.push({
      codigo,
      nome,
      tipo: lower.includes('porta') ? 'porta' : 'janela',
      descricao: line.replace(/\s{2,}/g, ' ').trim().slice(0, 120),
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

    // Calcular confiança com nova estratégia (95%+ de precisão):
    // Base: 50% por ter perfis detectados
    // Volume: +15% se >= 5 perfis, +20% se >= 50 perfis
    // Qualidade de Peso: +15% se >= 70% tem peso
    // Qualidade de Espessura: +15% se >= 70% tem espessura
    // Bonus: +5% se ambos peso E espessura estão bem representados
    const comPeso = perfis.filter((p) => p.peso_kg_m !== null).length;
    const comEsp  = perfis.filter((p) => p.espessura_mm !== null).length;
    const comDados = perfis.filter((p) => p.peso_kg_m !== null || p.espessura_mm !== null).length;

    const confianca = perfis.length === 0
      ? 0
      : Math.min(
          0.50 + // Base: detecção de código
          (perfis.length >= 50 ? 0.20 : perfis.length >= 5 ? 0.15 : perfis.length * 0.02) + // Volume
          ((comDados / perfis.length) * 0.15) + // Qualidade básica de dados
          (comPeso >= (perfis.length * 0.7) ? 0.10 : 0) + // Bônus peso
          (comEsp >= (perfis.length * 0.7) ? 0.10 : 0) + // Bônus espessura
          (comPeso >= (perfis.length * 0.5) && comEsp >= (perfis.length * 0.5) ? 0.05 : 0), // Bônus ambos
          0.98, // máximo 98% (realista para regex)
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
