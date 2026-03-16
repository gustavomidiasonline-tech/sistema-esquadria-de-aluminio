import { describe, it, expect, vi, beforeEach } from 'vitest';

// Chainable supabase mock builder
function createQueryBuilder(finalResult: { data: unknown; error: unknown } = { data: null, error: null }) {
  const builder: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'update', 'upsert', 'eq', 'order', 'single', 'limit'];
  for (const method of methods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }
  (builder.single as ReturnType<typeof vi.fn>).mockReturnValue(finalResult);
  (builder.order as ReturnType<typeof vi.fn>).mockReturnValue(finalResult);
  (builder.eq as ReturnType<typeof vi.fn>).mockReturnValue(builder);
  return builder;
}

const mockFromImpl = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFromImpl(...args),
  },
}));

// Mock eventBus
vi.mock('@/services/eventBus', () => ({
  eventBus: {
    emit: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
  },
}));

// Mock fetch for Claude API
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { CatalogImportService } from '@/services/catalog-import.service';
import type { CatalogExtractedData } from '@/services/catalog-import.service';

describe('CatalogImportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extrairComIA', () => {
    it('should call Claude API and parse JSON response', async () => {
      const extractedData: CatalogExtractedData = {
        fabricante: 'Hydro',
        perfis: [
          { codigo: 'H-001', nome: 'Perfil Marco', peso_kg_m: 0.5, largura_mm: 40, espessura_mm: 1.2 },
        ],
        modelos: [
          { codigo: 'M-001', nome: 'Janela Correr', tipo: 'correr' },
        ],
        confianca: 0.9,
        avisos: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: [{ type: 'text', text: JSON.stringify(extractedData) }],
        }),
      });

      const result = await CatalogImportService.extrairComIA('catalog text here', 'test-api-key');

      expect(result.fabricante).toBe('Hydro');
      expect(result.perfis).toHaveLength(1);
      expect(result.modelos).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-api-key',
          }),
        })
      );
    });

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      await expect(
        CatalogImportService.extrairComIA('text', 'bad-key')
      ).rejects.toThrow('Claude API error 401');
    });

    it('should throw when no JSON in response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: [{ type: 'text', text: 'No JSON here just plain text without braces' }],
        }),
      });

      await expect(
        CatalogImportService.extrairComIA('text', 'key')
      ).rejects.toThrow('Claude');
    });

    it('should truncate content to 8000 chars', async () => {
      const longText = 'A'.repeat(10000);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: [{ type: 'text', text: '{"fabricante":"Test","perfis":[],"modelos":[],"confianca":0.5,"avisos":[]}' }],
        }),
      });

      await CatalogImportService.extrairComIA(longText, 'key');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      const sentContent = body.messages[0].content as string;
      // The prompt + truncated text; the raw text portion should be max 8000 chars
      expect(sentContent.length).toBeLessThan(longText.length + 500);
    });
  });

  describe('listarJobs', () => {
    it('should return jobs ordered by created_at desc', async () => {
      const jobs = [
        { id: 'j1', company_id: 'c1', nome_arquivo: 'catalog.pdf', status: 'concluido', total_perfis: 5, total_modelos: 2, erro: null, created_at: '2026-03-16' },
      ];
      const builder = createQueryBuilder({ data: jobs, error: null });
      mockFromImpl.mockReturnValue(builder);

      const result = await CatalogImportService.listarJobs('c1');
      expect(result).toEqual(jobs);
      expect(mockFromImpl).toHaveBeenCalledWith('ai_import_jobs');
    });

    it('should throw on error', async () => {
      const builder = createQueryBuilder({ data: null, error: { message: 'DB error' } });
      mockFromImpl.mockReturnValue(builder);

      await expect(CatalogImportService.listarJobs('c1')).rejects.toThrow('Erro ao listar jobs');
    });
  });

  describe('iniciarImportacao', () => {
    it('should create a job and start processing', async () => {
      const job = {
        id: 'j1',
        company_id: 'c1',
        nome_arquivo: 'catalog.pdf',
        status: 'processando',
        total_perfis: 0,
        total_modelos: 0,
        created_at: '2026-03-16',
      };
      const builder = createQueryBuilder({ data: job, error: null });
      mockFromImpl.mockReturnValue(builder);

      // Mock processarJob to avoid actual processing
      const processarSpy = vi.spyOn(CatalogImportService, 'processarJob').mockResolvedValue();

      const result = await CatalogImportService.iniciarImportacao('c1', 'catalog.pdf', 'content', 'key');
      expect(result).toEqual(job);

      // Wait a tick for the fire-and-forget to start
      await new Promise((r) => setTimeout(r, 10));
      expect(processarSpy).toHaveBeenCalledWith('j1', 'c1', 'content', 'key');

      processarSpy.mockRestore();
    });

    it('should throw when job creation fails', async () => {
      const builder = createQueryBuilder({ data: null, error: { message: 'insert failed' } });
      mockFromImpl.mockReturnValue(builder);

      await expect(
        CatalogImportService.iniciarImportacao('c1', 'catalog.pdf', 'content', 'key')
      ).rejects.toThrow('Erro ao criar job');
    });
  });

  describe('confirmarImportacao', () => {
    it('should throw when job not found', async () => {
      const builder = createQueryBuilder({ data: null, error: { message: 'not found' } });
      mockFromImpl.mockReturnValue(builder);

      await expect(
        CatalogImportService.confirmarImportacao('j1', 'c1')
      ).rejects.toThrow('Job');
    });

    it('should throw when job has no data to import', async () => {
      const builder = createQueryBuilder({
        data: { dados_para_import: null, nome_arquivo: 'test.pdf' },
        error: null,
      });
      mockFromImpl.mockReturnValue(builder);

      await expect(
        CatalogImportService.confirmarImportacao('j1', 'c1')
      ).rejects.toThrow('sem dados');
    });
  });
});
