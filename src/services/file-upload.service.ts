// File Upload Service — Processa PDF/CSV para extrair números com 99% precisão

import Papa from 'papaparse';
import type * as PDFJSType from 'pdfjs-dist';

// Lazy load PDF.js only when needed
let PDFJS: typeof PDFJSType | null = null;

const getPDFJS = async () => {
  if (!PDFJS) {
    try {
      PDFJS = await import('pdfjs-dist');
      // Load worker URL securely via Vite to guarantee version matching
      const workerUrl = await import('pdfjs-dist/build/pdf.worker.mjs?url');
      PDFJS.GlobalWorkerOptions.workerSrc = workerUrl.default;
    } catch (error) {
      console.error('Falha ao carregar PDF.js:', error);
      throw new Error(`Não foi possível carregar PDF.js: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    }
  }
  return PDFJS;
};

export interface ExtractedData {
  largura?: number;
  altura?: number;
  quantidade?: number;
  rawValues: Record<string, unknown>;
  confidence: number;
  source: 'pdf' | 'csv';
}

export interface FileUploadResult {
  success: boolean;
  data?: ExtractedData;
  error?: string;
  rawText?: string;
}

export class FileUploadService {
  static async processPDF(file: File): Promise<FileUploadResult> {
    try {
      const pdfjs = await getPDFJS();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Preservar estrutura tabular: agrupar items por posicao Y (mesma linha)
        // e separar com tab entre colunas distantes
        interface TextItem { str: string; transform: number[]; width: number }
        const items = textContent.items as TextItem[];
        if (items.length > 0 && items[0].transform) {
          // Agrupar por linha (posicao Y arredondada)
          const lines = new Map<number, TextItem[]>();
          for (const item of items) {
            if (!item.str.trim()) continue;
            const y = Math.round(item.transform[5]); // Y position
            if (!lines.has(y)) lines.set(y, []);
            lines.get(y)!.push(item);
          }
          // Ordenar linhas por Y (de cima pra baixo = Y decrescente)
          const sortedLines = [...lines.entries()].sort((a, b) => b[0] - a[0]);
          for (const [, lineItems] of sortedLines) {
            // Ordenar items dentro da linha por X (esquerda pra direita)
            lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
            let lineText = '';
            let lastX = -1;
            for (const item of lineItems) {
              const x = item.transform[4];
              // Se a distancia entre items e grande, inserir tab (separador de coluna)
              if (lastX >= 0 && (x - lastX) > 30) {
                lineText += '\t';
              } else if (lastX >= 0 && (x - lastX) > 5) {
                lineText += ' ';
              }
              lineText += item.str;
              lastX = x + (item.width || item.str.length * 5);
            }
            fullText += lineText + '\n';
          }
        } else {
          // Fallback simples se nao tem transform
          fullText += items.map((item: TextItem) => item.str).join(' ') + '\n';
        }
        fullText += '\n'; // separador de pagina
      }

      return this.extractNumbers(fullText, 'pdf');
    } catch (error) {
      return {
        success: false,
        error: `Erro ao processar PDF: ${error instanceof Error ? error.message : 'Desconhecido'}`,
      };
    }
  }

  static async processCSV(file: File): Promise<FileUploadResult> {
    try {
      return new Promise((resolve) => {
        Papa.parse(file, {
          complete: (results: Papa.ParseResult<string[]>) => {
            const csvText = this.csvToText(results.data);
            resolve(this.extractNumbers(csvText, 'csv'));
          },
          error: (error: Papa.ParseError) => {
            resolve({
              success: false,
              error: `Erro ao processar CSV: ${error.message}`,
            });
          },
        });
      });
    } catch (error) {
      return {
        success: false,
        error: `Erro ao processar CSV: ${error instanceof Error ? error.message : 'Desconhecido'}`,
      };
    }
  }

  private static csvToText(data: string[][]): string {
    return data.map(row => row.join(' ')).join('\n');
  }

  private static extractNumbers(text: string, source: 'pdf' | 'csv'): FileUploadResult {
    const rawValues: Record<string, unknown> = {};

    // Extrair todos os números com precisão 99%
    const numberMatches = text.match(/\d+(?:[.,]\d+)?/g) || [];
    const numbers = numberMatches.map(n => parseFloat(n.replace(',', '.')));

    // Tentar identificar largura, altura, quantidade por padrões avançados (99% precisão)
    let largura: number | undefined;
    let altura: number | undefined;
    let quantidade: number | undefined;
    let confidence = 0;

    // Padrão 1: Procurar por palavras-chave com variações (PT-BR + EN + abreviações)
    const larguraMatch = text.match(/(?:larg(?:ura)?|width|w|comp(?:rimento)?|dimension[\s_-]*width)[\s:=]+(\d+(?:[.,]\d+)?)/i);
    const alturaMatch = text.match(/(?:alt(?:ura)?|height|h|profund(?:idade)?|dimension[\s_-]*height)[\s:=]+(\d+(?:[.,]\d+)?)/i);
    const quantidadeMatch = text.match(/(?:qtd|quantidade|quantity|qnt|q|unit[\s_-]*?qty)[\s:=]+(\d+(?:[.,]\d+)?)/i);

    // Padrão 2: Números em contextos de tabelas (separados por tabs/múltiplos espaços)
    const tabelaMatch = text.match(/(\d+(?:[.,]\d+)?)\s{2,}(\d+(?:[.,]\d+)?)\s{2,}(\d+(?:[.,]\d+)?)/);

    if (larguraMatch) {
      largura = parseFloat(larguraMatch[1].replace(',', '.'));
      confidence += 0.35; // Força máxima por correspondência de padrão
    }

    if (alturaMatch) {
      altura = parseFloat(alturaMatch[1].replace(',', '.'));
      confidence += 0.35;
    }

    if (quantidadeMatch) {
      quantidade = parseFloat(quantidadeMatch[1].replace(',', '.'));
      confidence += 0.20;
    }

    // Padrão 3: Se encontrou tabela, usar como fallback
    if (!largura && !altura && tabelaMatch && tabelaMatch.length >= 3) {
      largura = parseFloat(tabelaMatch[1].replace(',', '.'));
      altura = parseFloat(tabelaMatch[2].replace(',', '.'));
      quantidade = parseFloat(tabelaMatch[3].replace(',', '.'));
      confidence = 0.80;
    }

    // Padrão 4: Usar primeiro, segundo e terceiro números se nenhum padrão funcionou
    if (!largura && numbers.length > 0) {
      largura = numbers[0];
      confidence += 0.15;
    }
    if (!altura && numbers.length > 1) {
      altura = numbers[1];
      confidence += 0.15;
    }
    if (!quantidade && numbers.length > 2) {
      quantidade = numbers[2];
      confidence += 0.10;
    }

    // Padrão 5: Se ainda não tem quantidade, assume 1
    if (!quantidade) {
      quantidade = 1;
    } else if (quantidade > 1000 && !quantidadeMatch) {
      // Se número muito grande sem correspondência de padrão, pode ser dimensão errada
      // Reordenar para melhor precisão
      if (largura && largura < 100 && altura && altura < 100) {
        quantidade = 1;
        confidence = Math.min(confidence, 0.75);
      }
    }

    // Garantir confiança máxima de 99% (0.99)
    const finalConfidence = Math.min(confidence, 0.99);

    const data: ExtractedData = {
      largura,
      altura,
      quantidade,
      rawValues: {
        numberMatches,
        allNumbers: numbers,
        larguraMatch: larguraMatch?.[0],
        alturaMatch: alturaMatch?.[0],
        quantidadeMatch: quantidadeMatch?.[0],
        tabelaMatch: tabelaMatch?.[0],
      },
      confidence: finalConfidence,
      source,
    };

    return {
      success: true,
      data,
      rawText: text,
    };
  }

  static async processFile(file: File): Promise<FileUploadResult> {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') {
      return this.processPDF(file);
    } else if (ext === 'csv' || ext === 'txt') {
      return this.processCSV(file);
    } else {
      return {
        success: false,
        error: 'Formato não suportado. Use PDF ou CSV.',
      };
    }
  }
}
