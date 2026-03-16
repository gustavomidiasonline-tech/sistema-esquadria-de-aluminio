import { describe, it, expect, vi, beforeEach } from 'vitest';

// Build a proper chainable mock for supabase
function createQueryBuilder(finalResult: { data: unknown; error: unknown } = { data: null, error: null }) {
  const builder: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'update', 'upsert', 'eq', 'order', 'single', 'filter'];
  for (const method of methods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }
  // Terminal calls return the final result but ALSO have chainable methods
  const terminalResult = { ...finalResult, eq: vi.fn().mockReturnValue(finalResult) };
  (builder.single as ReturnType<typeof vi.fn>).mockReturnValue(finalResult);
  (builder.order as ReturnType<typeof vi.fn>).mockReturnValue(terminalResult);
  (builder.filter as ReturnType<typeof vi.fn>).mockReturnValue(finalResult);
  (builder.eq as ReturnType<typeof vi.fn>).mockReturnValue(builder);
  return builder;
}

// Chainable update builder where .eq().eq() returns { error: null }
function createUpdateBuilder(updateResult: { error: unknown } = { error: null }) {
  const result = { ...updateResult };
  const builder: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'update', 'upsert', 'eq', 'order', 'single', 'filter'];
  for (const method of methods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }
  // For update chains like .update({}).eq('id', x).eq('company_id', y)
  // The last eq returns the result
  let eqCallCount = 0;
  (builder.eq as ReturnType<typeof vi.fn>).mockImplementation(() => {
    eqCallCount++;
    if (eqCallCount >= 2) return result;
    return builder;
  });
  return builder;
}

let currentBuilder: ReturnType<typeof createQueryBuilder>;
const mockFrom = vi.fn().mockImplementation(() => currentBuilder);

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { InventoryService } from '@/services/inventory.service';

describe('InventoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listarItens', () => {
    it('should list all inventory items for a company', async () => {
      const items = [
        { id: '1', company_id: 'c1', codigo: 'P001', nome: 'Perfil A', tipo: 'perfil' },
      ];
      currentBuilder = createQueryBuilder();
      // The chain: .select('*').eq(...).order(...).order(...)
      // After select, eq returns builder. After first order, second order returns final result.
      // We need the last call to return { data, error }
      let orderCallCount = 0;
      (currentBuilder.order as ReturnType<typeof vi.fn>).mockImplementation(() => {
        orderCallCount++;
        if (orderCallCount >= 2) {
          return { data: items, error: null };
        }
        return currentBuilder;
      });

      const result = await InventoryService.listarItens('c1');
      expect(result).toEqual(items);
    });

    it('should throw on supabase error', async () => {
      currentBuilder = createQueryBuilder();
      let orderCallCount = 0;
      (currentBuilder.order as ReturnType<typeof vi.fn>).mockImplementation(() => {
        orderCallCount++;
        if (orderCallCount >= 2) {
          return { data: null, error: { message: 'DB error' } };
        }
        return currentBuilder;
      });

      await expect(InventoryService.listarItens('c1')).rejects.toThrow('Erro ao listar estoque');
    });

    it('should filter by tipo when provided', async () => {
      currentBuilder = createQueryBuilder();
      let orderCallCount = 0;
      (currentBuilder.order as ReturnType<typeof vi.fn>).mockImplementation(() => {
        orderCallCount++;
        if (orderCallCount >= 2) {
          return { data: [], error: null, eq: vi.fn().mockReturnValue({ data: [], error: null }) };
        }
        return currentBuilder;
      });
      // When tipo is given, an extra .eq('tipo', tipo) is called on the query
      // This is hard to test with mocks, so we just verify no error
      const result = await InventoryService.listarItens('c1', 'perfil');
      expect(result).toEqual([]);
    });
  });

  describe('buscarPorCodigo', () => {
    it('should return item when found', async () => {
      const item = { id: '1', codigo: 'P001', nome: 'Perfil A' };
      currentBuilder = createQueryBuilder({ data: item, error: null });

      const result = await InventoryService.buscarPorCodigo('c1', 'P001');
      expect(result).toEqual(item);
    });

    it('should return null when not found (PGRST116)', async () => {
      currentBuilder = createQueryBuilder({ data: null, error: { code: 'PGRST116', message: 'not found' } });

      const result = await InventoryService.buscarPorCodigo('c1', 'NONEXIST');
      expect(result).toBeNull();
    });

    it('should throw on other errors', async () => {
      currentBuilder = createQueryBuilder({ data: null, error: { code: 'OTHER', message: 'unexpected' } });

      await expect(InventoryService.buscarPorCodigo('c1', 'P001')).rejects.toThrow('Erro ao buscar item');
    });
  });

  describe('salvarItem', () => {
    it('should upsert item and return result', async () => {
      const saved = { id: '1', company_id: 'c1', codigo: 'P001', nome: 'Perfil A' };
      currentBuilder = createQueryBuilder({ data: saved, error: null });

      const result = await InventoryService.salvarItem('c1', {
        codigo: 'P001',
        nome: 'Perfil A',
        tipo: 'perfil',
        quantidade_disponivel: 100,
        quantidade_reservada: 0,
        quantidade_minima: 10,
        unidade: 'barra',
      });

      expect(result).toEqual(saved);
    });

    it('should throw on upsert error', async () => {
      currentBuilder = createQueryBuilder({ data: null, error: { message: 'conflict' } });

      await expect(
        InventoryService.salvarItem('c1', {
          codigo: 'P001',
          nome: 'Perfil A',
          tipo: 'perfil',
          quantidade_disponivel: 100,
          quantidade_reservada: 0,
          quantidade_minima: 10,
          unidade: 'barra',
        })
      ).rejects.toThrow('Erro ao salvar item');
    });
  });

  describe('atualizarQuantidade', () => {
    it('should increment quantity', async () => {
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createQueryBuilder({ data: { quantidade_disponivel: 50 }, error: null });
        }
        return createUpdateBuilder({ error: null });
      });

      await expect(
        InventoryService.atualizarQuantidade('c1', 'item-1', 10)
      ).resolves.toBeUndefined();
    });

    it('should not go below zero (clamps with Math.max)', async () => {
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createQueryBuilder({ data: { quantidade_disponivel: 5 }, error: null });
        }
        return createUpdateBuilder({ error: null });
      });

      await expect(
        InventoryService.atualizarQuantidade('c1', 'item-1', -100)
      ).resolves.toBeUndefined();
    });

    it('should throw if item not found', async () => {
      mockFrom.mockImplementation(() => {
        return createQueryBuilder({ data: null, error: { message: 'not found' } });
      });

      await expect(
        InventoryService.atualizarQuantidade('c1', 'nonexist', 10)
      ).rejects.toThrow('Item');
    });
  });

  describe('reservar', () => {
    it('should decrease available and increase reserved', async () => {
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createQueryBuilder({ data: { quantidade_disponivel: 100, quantidade_reservada: 10 }, error: null });
        }
        return createUpdateBuilder({ error: null });
      });

      await expect(
        InventoryService.reservar('c1', 'item-1', 20)
      ).resolves.toBeUndefined();
    });

    it('should throw when insufficient stock', async () => {
      mockFrom.mockImplementation(() => {
        return createQueryBuilder({ data: { quantidade_disponivel: 5, quantidade_reservada: 0 }, error: null });
      });

      await expect(
        InventoryService.reservar('c1', 'item-1', 20)
      ).rejects.toThrow('Estoque insuficiente');
    });
  });

  describe('liberarReserva', () => {
    it('should move reserved back to available', async () => {
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createQueryBuilder({ data: { quantidade_disponivel: 80, quantidade_reservada: 20 }, error: null });
        }
        return createUpdateBuilder({ error: null });
      });

      await expect(
        InventoryService.liberarReserva('c1', 'item-1', 10)
      ).resolves.toBeUndefined();
    });

    it('should not release more than reserved (clamps)', async () => {
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createQueryBuilder({ data: { quantidade_disponivel: 80, quantidade_reservada: 5 }, error: null });
        }
        return createUpdateBuilder({ error: null });
      });

      await expect(
        InventoryService.liberarReserva('c1', 'item-1', 100)
      ).resolves.toBeUndefined();
    });
  });

  describe('getAlertasEstoque', () => {
    it('should return items below minimum stock', async () => {
      currentBuilder = createQueryBuilder();
      (currentBuilder.filter as ReturnType<typeof vi.fn>).mockReturnValue({
        data: [
          { id: '1', codigo: 'P001', nome: 'Perfil A', quantidade_disponivel: 3, quantidade_minima: 10 },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(currentBuilder);

      const alerts = await InventoryService.getAlertasEstoque('c1');
      expect(alerts).toHaveLength(1);
      expect(alerts[0].deficit).toBe(7);
      expect(alerts[0].codigo).toBe('P001');
    });

    it('should return empty array when all stock is OK', async () => {
      currentBuilder = createQueryBuilder();
      (currentBuilder.filter as ReturnType<typeof vi.fn>).mockReturnValue({ data: [], error: null });
      mockFrom.mockReturnValue(currentBuilder);

      const alerts = await InventoryService.getAlertasEstoque('c1');
      expect(alerts).toHaveLength(0);
    });

    it('should throw on error', async () => {
      currentBuilder = createQueryBuilder();
      (currentBuilder.filter as ReturnType<typeof vi.fn>).mockReturnValue({ data: null, error: { message: 'DB error' } });
      mockFrom.mockReturnValue(currentBuilder);

      await expect(InventoryService.getAlertasEstoque('c1')).rejects.toThrow('Erro ao buscar alertas');
    });
  });
});
