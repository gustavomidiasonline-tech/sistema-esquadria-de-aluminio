import Papa from 'papaparse';
import type { InventoryItemTipo } from '@/services/inventory.service';
import type * as PDFJSType from 'pdfjs-dist';

export interface InventoryImportItem {
  codigo: string;
  nome: string;
  tipo: InventoryItemTipo;
  quantidade: number;
  unidade: string;
}

export interface InventoryImportResult {
  success: boolean;
  items: InventoryImportItem[];
  errors: string[];
}

const TIPO_MAP: Record<string, InventoryItemTipo> = {
  perfil: 'perfil',
  vidro: 'vidro',
  ferragem: 'ferragem',
  acessorio: 'acessorio',
  acessorioo: 'acessorio',
  acessório: 'acessorio',
  outro: 'outro',
};

const COLUMN_ALIASES: Record<string, string> = {
  codigo: 'codigo',
  código: 'codigo',
  cod: 'codigo',
  nome: 'nome',
  descricao: 'nome',
  descrição: 'nome',
  tipo: 'tipo',
  quantidade: 'quantidade',
  qtd: 'quantidade',
  unidade: 'unidade',
  un: 'unidade',
};

// Lazy load PDF.js only when needed
let PDFJS: typeof PDFJSType | null = null;

// Import worker inline to avoid path resolution issues in Vite
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const getPDFJS = async () => {
  if (!PDFJS) {
    PDFJS = await import('pdfjs-dist');
    // Use the imported worker URL directly - Vite handles the path resolution
    PDFJS.GlobalWorkerOptions.workerSrc = pdfWorker;
  }
  return PDFJS;
};

function normalizeKey(key: string): string {
  const trimmed = key.trim().toLowerCase();
  return COLUMN_ALIASES[trimmed] ?? trimmed;
}

function parseTipo(raw: string): InventoryItemTipo | null {
  const key = raw.trim().toLowerCase();
  return TIPO_MAP[key] ?? null;
}

export async function parseInventoryImportFile(file: File): Promise<InventoryImportResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'csv' && ext !== 'pdf') {
    return {
      success: false,
      items: [],
      errors: ['Formato nao suportado. Use CSV ou PDF.'],
    };
  }

  if (ext === 'pdf') {
    return parseInventoryPDF(file);
  }

  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const items: InventoryImportItem[] = [];
        const errors: string[] = [];

        results.data.forEach((row, index) => {
          const normalized: Record<string, string> = {};
          Object.keys(row).forEach((key) => {
            const normalizedKey = normalizeKey(key);
            normalized[normalizedKey] = String(row[key] ?? '').trim();
          });

          const codigo = normalized.codigo ?? '';
          const nome = normalized.nome ?? '';
          const tipoRaw = normalized.tipo ?? '';
          const quantidadeRaw = normalized.quantidade ?? '';
          const unidade = normalized.unidade || 'un';

          const tipo = parseTipo(tipoRaw);
          const quantidade = Number(String(quantidadeRaw).replace(',', '.'));

          if (!codigo || !nome || !tipo || Number.isNaN(quantidade)) {
            errors.push(`Linha ${index + 2}: campos obrigatorios invalidos`);
            return;
          }

          items.push({
            codigo,
            nome,
            tipo,
            quantidade,
            unidade,
          });
        });

        resolve({
          success: errors.length === 0,
          items,
          errors,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          items: [],
          errors: [`Erro ao ler CSV: ${error.message}`],
        });
      },
    });
  });
}

async function parseInventoryPDF(file: File): Promise<InventoryImportResult> {
  try {
    const pdfjs = await getPDFJS();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;

    let fullText = '';
    const positionalRows: Array<{ text: string; cells: string[] }> = [];
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items as Array<{ str: string; transform: number[] }>;
      fullText += items.map((item) => item.str).join(' ') + '\n';
      positionalRows.push(...extractRowsFromItems(items));
    }

    const positionalResult = parseInventoryRows(positionalRows);
    if (positionalResult.items.length > 0) {
      return positionalResult;
    }
    return parseInventoryText(fullText);
  } catch (error) {
    return {
      success: false,
      items: [],
      errors: [`Erro ao processar PDF: ${error instanceof Error ? error.message : 'Desconhecido'}`],
    };
  }
}

function parseInventoryText(text: string): InventoryImportResult {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const errors: string[] = [];
  const items: InventoryImportItem[] = [];

  const headerIndex = lines.findIndex((line) => {
    const normalized = line.toLowerCase();
    return normalized.includes('codigo') && normalized.includes('nome') && normalized.includes('tipo');
  });

  if (headerIndex >= 0) {
    const headerLine = lines[headerIndex];
    const delimiter = detectDelimiter(headerLine);
    const headerCols = splitLine(headerLine, delimiter).map(normalizeKey);
    const colIndex = {
      codigo: headerCols.indexOf('codigo'),
      nome: headerCols.indexOf('nome'),
      tipo: headerCols.indexOf('tipo'),
      quantidade: headerCols.indexOf('quantidade'),
      unidade: headerCols.indexOf('unidade'),
    };

    for (let i = headerIndex + 1; i < lines.length; i += 1) {
      const row = splitLine(lines[i], delimiter);
      const codigo = row[colIndex.codigo]?.trim() ?? '';
      const nome = row[colIndex.nome]?.trim() ?? '';
      const tipoRaw = row[colIndex.tipo]?.trim() ?? '';
      const quantidadeRaw = row[colIndex.quantidade]?.trim() ?? '';
      const unidade = row[colIndex.unidade]?.trim() ?? 'un';

      const tipo = parseTipo(tipoRaw);
      const quantidade = Number(String(quantidadeRaw).replace(',', '.'));
      if (!codigo || !nome || !tipo || Number.isNaN(quantidade)) {
        errors.push(`Linha ${i + 1}: campos obrigatorios invalidos`);
        continue;
      }

      items.push({ codigo, nome, tipo, quantidade, unidade: unidade || 'un' });
    }
  } else {
    lines.forEach((line, index) => {
      const tokens = line.split(/\s+/).filter(Boolean);
      if (tokens.length < 5) {
        errors.push(`Linha ${index + 1}: formato nao reconhecido`);
        return;
      }

      const codigo = tokens[0];
      const unidade = tokens[tokens.length - 1];
      const quantidadeRaw = tokens[tokens.length - 2];
      const tipoRaw = tokens[tokens.length - 3];
      const nome = tokens.slice(1, -3).join(' ');

      const tipo = parseTipo(tipoRaw);
      const quantidade = Number(String(quantidadeRaw).replace(',', '.'));
      if (!codigo || !nome || !tipo || Number.isNaN(quantidade)) {
        errors.push(`Linha ${index + 1}: campos obrigatorios invalidos`);
        return;
      }

      items.push({ codigo, nome, tipo, quantidade, unidade: unidade || 'un' });
    });
  }

  return {
    success: errors.length === 0,
    items,
    errors,
  };
}

function parseInventoryRows(rows: Array<{ text: string; cells: string[] }>): InventoryImportResult {
  const errors: string[] = [];
  const items: InventoryImportItem[] = [];

  if (!rows.length) {
    return { success: false, items: [], errors: ['Nao foi possivel ler o PDF.'] };
  }

  const headerIndex = rows.findIndex((row) => {
    const normalized = row.text.toLowerCase();
    return normalized.includes('codigo') && normalized.includes('nome') && normalized.includes('tipo');
  });

  if (headerIndex >= 0) {
    const header = rows[headerIndex];
    const headerCols = header.cells.map(normalizeKey);
    const colIndex = {
      codigo: headerCols.indexOf('codigo'),
      nome: headerCols.indexOf('nome'),
      tipo: headerCols.indexOf('tipo'),
      quantidade: headerCols.indexOf('quantidade'),
      unidade: headerCols.indexOf('unidade'),
    };

    for (let i = headerIndex + 1; i < rows.length; i += 1) {
      const row = rows[i].cells;
      const codigo = row[colIndex.codigo]?.trim() ?? '';
      const nome = row[colIndex.nome]?.trim() ?? '';
      const tipoRaw = row[colIndex.tipo]?.trim() ?? '';
      const quantidadeRaw = row[colIndex.quantidade]?.trim() ?? '';
      const unidade = row[colIndex.unidade]?.trim() ?? 'un';

      const tipo = parseTipo(tipoRaw);
      const quantidade = Number(String(quantidadeRaw).replace(',', '.'));
      if (!codigo || !nome || !tipo || Number.isNaN(quantidade)) {
        errors.push(`Linha ${i + 1}: campos obrigatorios invalidos`);
        continue;
      }

      items.push({ codigo, nome, tipo, quantidade, unidade: unidade || 'un' });
    }
  }

  return {
    success: errors.length === 0,
    items,
    errors,
  };
}

function extractRowsFromItems(items: Array<{ str: string; transform: number[] }>): Array<{ text: string; cells: string[] }> {
  const rowsByY = new Map<number, Array<{ text: string; x: number }>>();
  const tolerance = 2.5;

  items.forEach((item) => {
    const [_, __, ___, ____, x, y] = item.transform;
    const bucket = Math.round(y / tolerance) * tolerance;
    const row = rowsByY.get(bucket) ?? [];
    row.push({ text: item.str, x });
    rowsByY.set(bucket, row);
  });

  const sortedRows = Array.from(rowsByY.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([_, rowItems]) => rowItems.sort((a, b) => a.x - b.x));

  if (!sortedRows.length) return [];

  const headerRowIndex = sortedRows.findIndex((row) => {
    const text = row.map((r) => r.text).join(' ').toLowerCase();
    return text.includes('codigo') && text.includes('nome') && text.includes('tipo');
  });

  if (headerRowIndex === -1) {
    return sortedRows.map((row) => ({
      text: row.map((r) => r.text).join(' ').trim(),
      cells: row.map((r) => r.text.trim()).filter(Boolean),
    }));
  }

  const headerRow = sortedRows[headerRowIndex];
  const headerCells = headerRow.map((r) => ({ text: r.text.trim(), x: r.x }));
  const columns = headerCells
    .map((cell) => ({ key: normalizeKey(cell.text), x: cell.x }))
    .filter((col) => col.key);

  if (!columns.length) {
    return sortedRows.map((row) => ({
      text: row.map((r) => r.text).join(' ').trim(),
      cells: row.map((r) => r.text.trim()).filter(Boolean),
    }));
  }

  const sortedColumns = columns.sort((a, b) => a.x - b.x);

  return sortedRows.map((row) => {
    const cells = new Array(sortedColumns.length).fill('');
    row.forEach((item) => {
      const colIndex = sortedColumns.findIndex((col, idx) => {
        const next = sortedColumns[idx + 1];
        return item.x >= col.x && (!next || item.x < next.x);
      });
      if (colIndex >= 0) {
        const current = cells[colIndex];
        cells[colIndex] = current ? `${current} ${item.text}` : item.text;
      }
    });
    return {
      text: row.map((r) => r.text).join(' ').trim(),
      cells: cells.map((c) => c.trim()),
    };
  });
}

function detectDelimiter(line: string): string {
  const candidates = [';', ',', '\t', '|'];
  let best = ',';
  let bestCount = 0;
  candidates.forEach((candidate) => {
    const count = line.split(candidate).length;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  });
  return best;
}

function splitLine(line: string, delimiter: string): string[] {
  return line.split(delimiter).map((value) => value.trim());
}
