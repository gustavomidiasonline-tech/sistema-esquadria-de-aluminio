import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need a fresh eventBus per test, so we import the class indirectly
// The module exports a singleton, so we re-create for isolation
describe('TypedEventBus (via eventBus singleton)', () => {
  // We'll import fresh each time to avoid cross-test pollution
  let eventBus: typeof import('@/services/eventBus')['eventBus'];

  beforeEach(async () => {
    // Reset module registry to get fresh singleton
    vi.resetModules();
    const mod = await import('@/services/eventBus');
    eventBus = mod.eventBus;
  });

  describe('on + emit', () => {
    it('should call handler when event is emitted', async () => {
      const handler = vi.fn();
      eventBus.on('quote.approved', handler);

      await eventBus.emit('quote.approved', {
        orcamentoId: 'orc-1',
        companyId: 'comp-1',
      });

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith({
        orcamentoId: 'orc-1',
        companyId: 'comp-1',
      });
    });

    it('should support multiple handlers for the same event', async () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      eventBus.on('pieces.generated', h1);
      eventBus.on('pieces.generated', h2);

      await eventBus.emit('pieces.generated', {
        cuttingPlanId: 'cp-1',
        totalPecas: 12,
      });

      expect(h1).toHaveBeenCalledOnce();
      expect(h2).toHaveBeenCalledOnce();
    });

    it('should not call handler for different events', async () => {
      const handler = vi.fn();
      eventBus.on('quote.approved', handler);

      await eventBus.emit('pieces.generated', {
        cuttingPlanId: 'cp-1',
        totalPecas: 5,
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('should stop receiving events after unsubscribe', async () => {
      const handler = vi.fn();
      const unsub = eventBus.on('quote.approved', handler);

      unsub();

      await eventBus.emit('quote.approved', {
        orcamentoId: 'orc-1',
        companyId: 'comp-1',
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should call handler only once then auto-unsubscribe', async () => {
      const handler = vi.fn();
      eventBus.once('production.created', handler);

      await eventBus.emit('production.created', {
        productionOrderId: 'po-1',
        numero: 'OP-2026-0001',
      });

      await eventBus.emit('production.created', {
        productionOrderId: 'po-2',
        numero: 'OP-2026-0002',
      });

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith({
        productionOrderId: 'po-1',
        numero: 'OP-2026-0001',
      });
    });
  });

  describe('off', () => {
    it('should remove all handlers for an event', async () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      eventBus.on('cutting.optimized', h1);
      eventBus.on('cutting.optimized', h2);

      eventBus.off('cutting.optimized');

      await eventBus.emit('cutting.optimized', {
        cuttingPlanId: 'cp-1',
        totalBarras: 3,
        aproveitamento: 85,
      });

      expect(h1).not.toHaveBeenCalled();
      expect(h2).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should catch handler errors and continue with next handler', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const h1 = vi.fn(() => { throw new Error('boom'); });
      const h2 = vi.fn();

      eventBus.on('pipeline.error', h1);
      eventBus.on('pipeline.error', h2);

      await eventBus.emit('pipeline.error', {
        stage: 'test',
        error: 'test error',
        context: {},
      });

      expect(h1).toHaveBeenCalledOnce();
      expect(h2).toHaveBeenCalledOnce();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle async handlers', async () => {
      const results: number[] = [];
      eventBus.on('quote.approved', async () => {
        await new Promise((r) => setTimeout(r, 10));
        results.push(1);
      });
      eventBus.on('quote.approved', async () => {
        results.push(2);
      });

      await eventBus.emit('quote.approved', {
        orcamentoId: 'orc-1',
        companyId: 'comp-1',
      });

      expect(results).toEqual([1, 2]);
    });
  });

  describe('emit with no handlers', () => {
    it('should not throw when emitting event with no handlers', async () => {
      await expect(
        eventBus.emit('quote.approved', {
          orcamentoId: 'orc-1',
          companyId: 'comp-1',
        })
      ).resolves.toBeUndefined();
    });
  });
});
