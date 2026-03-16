// File Upload Service — Processa PDF/CSV para extrair números e ajustar cálculos

import Papa from 'papaparse';

// Lazy load PDF.js only when needed
let PDFJS: any = null;

const getPDFJS = async () => {
  if (!PDFJS) {
    PDFJS = await import('pdfjs-dist');
    PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;
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
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
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
          complete: (results: any) => {
            const csvText = this.csvToText(results.data);
            resolve(this.extractNumbers(csvText, 'csv'));
          },
          error: (error: any) => {
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

  private static csvToText(data: any[][]): string {
    return data.map(row => row.join(' ')).join('\n');
  }

  private static extractNumbers(text: string, source: 'pdf' | 'csv'): FileUploadResult {
    const rawValues: Record<string, unknown> = {};

    // Extrair números do texto
    const numberMatches = text.match(/\d+(?:[.,]\d+)?/g) || [];
    const numbers = numberMatches.map(n => parseFloat(n.replace(',', '.')));

    // Tentar identificar largura, altura, quantidade por padrões
    let largura: number | undefined;
    let altura: number | undefined;
    let quantidade: number | undefined;

    // Padrão 1: Procurar por palavras-chave
    const larguraMatch = text.match(/(?:larg|width|wid|l[\s:=]*)[\s:=]*(\d+(?:[.,]\d+)?)/i);
    const alturaMatch = text.match(/(?:alt|height|hei|h[\s:=]*)[\s:=]*(\d+(?:[.,]\d+)?)/i);
    const quantidadeMatch = text.match(/(?:qtd|quantidade|quantity|qnt|q[\s:=]*)[\s:=]*(\d+(?:[.,]\d+)?)/i);

    if (larguraMatch) largura = parseFloat(larguraMatch[1].replace(',', '.'));
    if (alturaMatch) altura = parseFloat(alturaMatch[1].replace(',', '.'));
    if (quantidadeMatch) quantidade = parseFloat(quantidadeMatch[1].replace(',', '.'));

    // Padrão 2: Se não encontrou por palavras-chave, usar os números extraídos
    if (!largura && numbers.length > 0) largura = numbers[0];
    if (!altura && numbers.length > 1) altura = numbers[1];
    if (!quantidade && numbers.length > 2) quantidade = numbers[2];

    // Padrão 3: Se ainda não tem quantidade, assume 1
    if (!quantidade) quantidade = 1;

    // Calcular confiança: quanto mais padrões baterem, maior a confiança
    let confidence = 0.5;
    if (larguraMatch) confidence += 0.15;
    if (alturaMatch) confidence += 0.15;
    if (quantidadeMatch) confidence += 0.1;
    if (largura && altura && quantidade) confidence = Math.min(confidence + 0.1, 1);

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
      },
      confidence,
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
