import { describe, it, expect, vi } from 'vitest';
import { FileUploadService } from './file-upload.service';

// Note: Full PDF processing tests are skipped in Node.js environment due to DOMMatrix dependency
// See file-upload.service.integration.test.ts for browser-based PDF tests

describe('FileUploadService (Node.js compatible tests)', () => {
  describe('extractNumbers', () => {
    it('should extract numbers from text with keywords', () => {
      const text = 'Largura: 1500mm, Altura: 1200mm, Quantidade: 2';
      const result = FileUploadService['extractNumbers'](text, 'pdf');

      expect(result.success).toBe(true);
      expect(result.data?.largura).toBe(1500);
      expect(result.data?.altura).toBe(1200);
      expect(result.data?.quantidade).toBe(2);
      expect(result.data?.confidence).toBeGreaterThan(0.6);
    });

    it('should extract numbers with different keyword formats', () => {
      const text = 'Larg: 1000 | Alt: 2000 | Qtd: 3';
      const result = FileUploadService['extractNumbers'](text, 'csv');

      expect(result.success).toBe(true);
      expect(result.data?.largura).toBe(1000);
      expect(result.data?.altura).toBe(2000);
      expect(result.data?.quantidade).toBe(3);
    });

    it('should handle decimal numbers with comma separator', () => {
      const text = 'Largura: 1500,5 Altura: 1200,3';
      const result = FileUploadService['extractNumbers'](text, 'pdf');

      expect(result.success).toBe(true);
      expect(result.data?.largura).toBe(1500.5);
      expect(result.data?.altura).toBe(1200.3);
    });

    it('should fallback to sequential number extraction', () => {
      const text = '1500 1200 2';
      const result = FileUploadService['extractNumbers'](text, 'csv');

      expect(result.success).toBe(true);
      expect(result.data?.largura).toBe(1500);
      expect(result.data?.altura).toBe(1200);
      expect(result.data?.quantidade).toBe(2);
    });

    it('should set default quantity to 1 if not found', () => {
      const text = 'Largura: 1000 Altura: 1500';
      const result = FileUploadService['extractNumbers'](text, 'pdf');

      expect(result.success).toBe(true);
      expect(result.data?.quantidade).toBe(1);
    });

    it('should have confidence score between 0 and 1', () => {
      const result = FileUploadService['extractNumbers']('Largura: 1000 Altura: 1500', 'pdf');
      expect(result.data?.confidence).toBeGreaterThan(0);
      expect(result.data?.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle decimal numbers', () => {
      const text = 'Largura: 1500.5 Altura: 1200.3';
      const result = FileUploadService['extractNumbers'](text, 'pdf');

      expect(result.success).toBe(true);
      expect(result.data?.largura).toBe(1500.5);
      expect(result.data?.altura).toBe(1200.3);
    });

    it('should handle mixed case keywords', () => {
      const text = 'LARGURA=1200 altura=1000 QUANTIDADE=5';
      const result = FileUploadService['extractNumbers'](text, 'csv');

      expect(result.success).toBe(true);
      expect(result.data?.largura).toBe(1200);
      expect(result.data?.altura).toBe(1000);
      expect(result.data?.quantidade).toBe(5);
    });

    it('should include rawValues in result', () => {
      const text = 'Largura: 1500 Altura: 1200';
      const result = FileUploadService['extractNumbers'](text, 'pdf');

      expect(result.data?.rawValues).toBeDefined();
      expect(result.data?.rawValues.numberMatches).toBeDefined();
      expect(result.data?.rawValues.allNumbers).toBeDefined();
    });

    it('should set source correctly', () => {
      const textPDF = 'Largura: 1500 Altura: 1200';
      const resultPDF = FileUploadService['extractNumbers'](textPDF, 'pdf');
      expect(resultPDF.data?.source).toBe('pdf');

      const resultCSV = FileUploadService['extractNumbers'](textPDF, 'csv');
      expect(resultCSV.data?.source).toBe('csv');
    });
  });

  describe('csvToText', () => {
    it('should convert CSV data to text format', () => {
      const csvData = [
        ['Largura', 'Altura', 'Quantidade'],
        ['1500', '1200', '2'],
        ['1000', '2000', '1'],
      ];

      const result = FileUploadService['csvToText'](csvData);

      expect(result).toContain('Largura Altura Quantidade');
      expect(result).toContain('1500 1200 2');
      expect(result).toContain('1000 2000 1');
    });

    it('should handle empty CSV data', () => {
      const result = FileUploadService['csvToText']([]);
      expect(result).toBe('');
    });
  });

  describe('processFile', () => {
    it('should reject unsupported file formats', async () => {
      const file = new File(['test'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const result = await FileUploadService.processFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Formato não suportado');
    });

    it('should accept CSV files', async () => {
      const csvContent = 'Largura,Altura,Quantidade\n1500,1200,2';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      const result = await FileUploadService.processFile(file);

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('csv');
    });

    it('should accept TXT files', async () => {
      const txtContent = 'Largura: 1500\nAltura: 1200\nQuantidade: 2';
      const file = new File([txtContent], 'test.txt', { type: 'text/plain' });
      const result = await FileUploadService.processFile(file);

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('csv');
    });
  });
});
