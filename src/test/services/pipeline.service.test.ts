import { describe, it, expect, vi, beforeEach } from 'vitest';

function createQueryBuilder(finalResult: { data: unknown; error: unknown } = { data: null, error: null }) {
  const builder: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'update', 'eq', 'order', 'single', 'limit'];
  for (const method of methods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }
  (builder.single as ReturnType<typeof vi.fn>).mockReturnValue(finalResult);
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
const mockEmit = vi.fn().mockResolvedValue(undefined);
const mockOn = vi.fn().mockReturnValue(vi.fn());

vi.mock('@/services/eventBus', () => ({
  eventBus: {
    emit: (...args: unknown[]) => mockEmit(...args),
    on: (...args: unknown[]) => mockOn(...args),
    off: vi.fn(),
    once: vi.fn(),
  },
}));

import { PipelineService } from '@/services/pipeline.service';

describe('PipelineService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should register a quote.approved event handler', () => {
      const unsub = PipelineService.initialize();

      expect(mockOn).toHaveBeenCalledWith('quote.approved', expect.any(Function));
      expect(typeof unsub).toBe('function');
    });

    it('should return an unsubscribe function', () => {
      const mockUnsub = vi.fn();
      mockOn.mockReturnValue(mockUnsub);

      const unsub = PipelineService.initialize();
      unsub();

      expect(mockUnsub).toHaveBeenCalled();
    });
  });

  describe('checkInventory', () => {
    it('should return generic gap when no inventory items exist', async () => {
      const builder = createQueryBuilder();
      // Chain: from('inventory_items').select(...).eq(...).eq('tipo', 'perfil')
      // The last .eq() must return { data: [], error: null }
      let eqCount = 0;
      (builder.eq as ReturnType<typeof vi.fn>).mockImplementation(() => {
        eqCount++;
        if (eqCount >= 2) return { data: [], error: null };
        return builder;
      });
      mockFromImpl.mockReturnValue(builder);

      const gaps = await PipelineService.checkInventory('cp-1', 'c1', 5);

      expect(gaps).toHaveLength(1);
      expect(gaps[0].codigo).toBe('PERFIL-GENERICO');
      expect(gaps[0].faltando).toBe(5);
    });

    it('should return gaps for items below minimum', async () => {
      const builder = createQueryBuilder();
      let eqCount = 0;
      (builder.eq as ReturnType<typeof vi.fn>).mockImplementation(() => {
        eqCount++;
        if (eqCount >= 2) return {
          data: [{
            id: '1', codigo: 'P001', nome: 'Perfil A', tipo: 'perfil',
            quantidade_disponivel: 2, quantidade_minima: 10, unidade: 'barra',
          }],
          error: null,
        };
        return builder;
      });
      mockFromImpl.mockReturnValue(builder);

      const gaps = await PipelineService.checkInventory('cp-1', 'c1', 3);

      expect(gaps).toHaveLength(1);
      expect(gaps[0].codigo).toBe('P001');
      expect(gaps[0].faltando).toBe(8);
    });

    it('should return empty array when all items are above minimum', async () => {
      const builder = createQueryBuilder();
      let eqCount = 0;
      (builder.eq as ReturnType<typeof vi.fn>).mockImplementation(() => {
        eqCount++;
        if (eqCount >= 2) return {
          data: [{
            id: '1', codigo: 'P001', nome: 'Perfil A', tipo: 'perfil',
            quantidade_disponivel: 50, quantidade_minima: 10, unidade: 'barra',
          }],
          error: null,
        };
        return builder;
      });
      mockFromImpl.mockReturnValue(builder);

      const gaps = await PipelineService.checkInventory('cp-1', 'c1', 3);
      expect(gaps).toHaveLength(0);
    });
  });

  describe('createPurchaseOrder', () => {
    it('should create purchase order with gap items', async () => {
      let fromCallCount = 0;
      mockFromImpl.mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          // Count query for numero generation
          const countBuilder = createQueryBuilder();
          (countBuilder.eq as ReturnType<typeof vi.fn>).mockReturnValue({ count: 3, error: null });
          return countBuilder;
        }
        if (fromCallCount === 2) {
          // Insert PO
          return createQueryBuilder({ data: { id: 'po-1' }, error: null });
        }
        // Insert PO items
        return createQueryBuilder({ data: null, error: null });
      });

      const gaps = [
        { codigo: 'P001', nome: 'Perfil A', tipo: 'perfil', necessario: 10, disponivel: 2, faltando: 8, unidade: 'barra' },
      ];

      const poId = await PipelineService.createPurchaseOrder('cp-1', 'c1', gaps);
      expect(poId).toBe('po-1');
    });

    it('should throw when PO insert fails', async () => {
      let fromCallCount = 0;
      mockFromImpl.mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          // Count query
          const countBuilder = createQueryBuilder();
          (countBuilder.eq as ReturnType<typeof vi.fn>).mockReturnValue({ count: 0, error: null });
          return countBuilder;
        }
        // Insert fails
        return createQueryBuilder({ data: null, error: { message: 'insert failed' } });
      });

      const gaps = [
        { codigo: 'P001', nome: 'Perfil', tipo: 'perfil', necessario: 10, disponivel: 2, faltando: 8, unidade: 'barra' },
      ];

      await expect(
        PipelineService.createPurchaseOrder('cp-1', 'c1', gaps)
      ).rejects.toThrow('Erro ao criar pedido de compra');
    });
  });

  describe('createProductionOrder', () => {
    it('should use existing production order if found', async () => {
      let fromCallCount = 0;
      mockFromImpl.mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          // existing check query: .from('production_orders').select().eq().order().limit().single()
          const b = createQueryBuilder({ data: { id: 'existing-op', numero: 'OP-2026-0001' }, error: null });
          (b.limit as ReturnType<typeof vi.fn>).mockReturnValue(b);
          return b;
        }
        // update query
        const updateBuilder = createQueryBuilder();
        (updateBuilder.eq as ReturnType<typeof vi.fn>).mockReturnValue({ error: null });
        return updateBuilder;
      });

      const result = await PipelineService.createProductionOrder('orc-1', 'cp-1', 'c1');
      expect(result.productionOrderId).toBe('existing-op');
      expect(result.numero).toBe('OP-2026-0001');
    });
  });

  describe('triggerForOrcamento', () => {
    it('should delegate to runFullPipeline', async () => {
      const spy = vi.spyOn(PipelineService, 'runFullPipeline').mockResolvedValue({
        cuttingPlanId: 'cp-1',
        cuttingPlanNumero: 'CP-2026-0001',
        inventoryGaps: [],
        purchaseOrderId: null,
        productionOrderId: 'op-1',
        productionOrderNumero: 'OP-2026-0001',
      });

      const result = await PipelineService.triggerForOrcamento('orc-1', 'c1');
      expect(spy).toHaveBeenCalledWith('orc-1', 'c1');
      expect(result.cuttingPlanId).toBe('cp-1');

      spy.mockRestore();
    });
  });

  describe('runFullPipeline', () => {
    it('should throw when no items found', async () => {
      const builder = createQueryBuilder();
      (builder.eq as ReturnType<typeof vi.fn>).mockReturnValue({ data: [], error: null });
      mockFromImpl.mockReturnValue(builder);

      await expect(
        PipelineService.runFullPipeline('orc-1', 'c1')
      ).rejects.toThrow('sem itens');
    });

    it('should throw when items query fails', async () => {
      const builder = createQueryBuilder();
      (builder.eq as ReturnType<typeof vi.fn>).mockReturnValue({ data: null, error: { message: 'query failed' } });
      mockFromImpl.mockReturnValue(builder);

      await expect(
        PipelineService.runFullPipeline('orc-1', 'c1')
      ).rejects.toThrow('Erro ao buscar itens');
    });
  });
});
