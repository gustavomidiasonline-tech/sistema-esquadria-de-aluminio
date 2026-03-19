/**
 * Testes para InventoryService — Sincronização de catálogo
 * Testa casos de sucesso, erro e edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InventoryService } from './inventory.service';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client');

describe('InventoryService.sincronizarDeCatalogo', () => {
  const mockCompanyId = 'test-company-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Sucesso', () => {
    it('deve sincronizar perfis novos do catálogo para o estoque', async () => {
      const mockCatalogPerfis = [
        { codigo: 'PRF-001', nome: 'Perfil Alumínio 40x20', tipo: 'perfil' },
        { codigo: 'PRF-002', nome: 'Perfil Alumínio 50x25', tipo: 'perfil' },
      ];

      const mockExistingItems: any[] = [];

      // Mock queries
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockExistingItems,
              error: null,
            }),
          }),
        }),
      });

      // Mock initial catalog fetch
      (supabase.from as any).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockCatalogPerfis,
            error: null,
          }),
        }),
      }));

      // Mock insert
      (supabase.from as any).mockImplementationOnce(() => ({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }));

      const result = await InventoryService.sincronizarDeCatalogo(mockCompanyId);

      expect(result.inserted).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.updated).toBe(0);
    });

    it('deve ignorar perfis que já existem no estoque', async () => {
      const mockCatalogPerfis = [
        { codigo: 'PRF-001', nome: 'Perfil Alumínio 40x20', tipo: 'perfil' },
        { codigo: 'PRF-002', nome: 'Perfil Alumínio 50x25', tipo: 'perfil' },
      ];

      const mockExistingItems = [{ codigo: 'PRF-001', nome: 'Perfil Alumínio 40x20' }];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockExistingItems,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockCatalogPerfis,
            error: null,
          }),
        }),
      }));

      (supabase.from as any).mockImplementationOnce(() => ({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }));

      const result = await InventoryService.sincronizarDeCatalogo(mockCompanyId);

      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it('deve processar inserts em batches de 50', async () => {
      // Criar 150 perfis para testar batching (3 batches)
      const mockCatalogPerfis = Array.from({ length: 150 }, (_, i) => ({
        codigo: `PRF-${String(i + 1).padStart(3, '0')}`,
        nome: `Perfil ${i + 1}`,
        tipo: 'perfil',
      }));

      const mockExistingItems: any[] = [];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockExistingItems,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockCatalogPerfis,
            error: null,
          }),
        }),
      }));

      // Mock 3 insert calls para os 3 batches
      const insertMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as any).mockImplementationOnce(() => ({
        insert: insertMock,
      }));

      const result = await InventoryService.sincronizarDeCatalogo(mockCompanyId);

      expect(result.inserted).toBe(150);
      expect(insertMock).toHaveBeenCalledTimes(3);
      expect(insertMock.mock.calls[0][0]).toHaveLength(50); // Batch 1
      expect(insertMock.mock.calls[1][0]).toHaveLength(50); // Batch 2
      expect(insertMock.mock.calls[2][0]).toHaveLength(50); // Batch 3
    });
  });

  describe('Erros', () => {
    it('deve lançar erro se falhar ao buscar catálogo', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      await expect(InventoryService.sincronizarDeCatalogo(mockCompanyId)).rejects.toThrow(
        'Erro ao buscar catálogo'
      );
    });

    it('deve lançar erro se falhar ao buscar itens existentes', async () => {
      const mockCatalogPerfis = [{ codigo: 'PRF-001', nome: 'Perfil', tipo: 'perfil' }];

      (supabase.from as any).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockCatalogPerfis,
            error: null,
          }),
        }),
      }));

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      await expect(InventoryService.sincronizarDeCatalogo(mockCompanyId)).rejects.toThrow(
        'Erro ao buscar estoque'
      );
    });

    it('deve lançar erro se falhar insert em batch', async () => {
      const mockCatalogPerfis = [
        { codigo: 'PRF-001', nome: 'Perfil', tipo: 'perfil' },
      ];

      const mockExistingItems: any[] = [];

      (supabase.from as any).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockCatalogPerfis,
            error: null,
          }),
        }),
      }));

      (supabase.from as any).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockExistingItems,
              error: null,
            }),
          }),
        }),
      }));

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      });

      await expect(InventoryService.sincronizarDeCatalogo(mockCompanyId)).rejects.toThrow(
        'Erro ao inserir batch'
      );
    });
  });

  describe('Edge Cases', () => {
    it('deve retornar 0 itens se catálogo estiver vazio', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const result = await InventoryService.sincronizarDeCatalogo(mockCompanyId);

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('deve ignorar perfis com código ou nome vazio', async () => {
      const mockCatalogPerfis = [
        { codigo: '', nome: 'Perfil sem código', tipo: 'perfil' },
        { codigo: 'PRF-001', nome: '', tipo: 'perfil' },
        { codigo: 'PRF-002', nome: 'Perfil válido', tipo: 'perfil' },
      ];

      const mockExistingItems: any[] = [];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockExistingItems,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockCatalogPerfis,
            error: null,
          }),
        }),
      }));

      (supabase.from as any).mockImplementationOnce(() => ({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }));

      const result = await InventoryService.sincronizarDeCatalogo(mockCompanyId);

      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(2);
    });

    it('deve ser case-insensitive ao comparar códigos existentes', async () => {
      const mockCatalogPerfis = [{ codigo: 'prf-001', nome: 'Perfil', tipo: 'perfil' }];

      const mockExistingItems = [{ codigo: 'PRF-001', nome: 'Perfil' }];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockExistingItems,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockCatalogPerfis,
            error: null,
          }),
        }),
      }));

      const result = await InventoryService.sincronizarDeCatalogo(mockCompanyId);

      expect(result.inserted).toBe(0);
      expect(result.skipped).toBe(1); // Deve reconhecer como duplicata
    });
  });
});
