/**
 * EventBus — Sistema de eventos tipado para o pipeline de produção
 * Implementação leve baseada em Map de callbacks.
 * Usado para desacoplar serviços no pipeline: quote.approved → pipeline completo.
 */

export type PipelineEventMap = {
  'quote.approved': { orcamentoId: string; companyId: string };
  'pieces.generated': { cuttingPlanId: string; totalPecas: number };
  'cutting.optimized': { cuttingPlanId: string; totalBarras: number; aproveitamento: number };
  'inventory.checked': { cuttingPlanId: string; faltando: InventoryGap[] };
  'purchase.created': { purchaseOrderId: string; itens: number };
  'production.created': { productionOrderId: string; numero: string };
  'catalog.import.completed': { jobId: string; perfis: number; modelos: number };
  'pipeline.error': { stage: string; error: string; context: Record<string, unknown> };
};

export interface InventoryGap {
  codigo: string;
  nome: string;
  tipo: string;
  necessario: number;
  disponivel: number;
  faltando: number;
  unidade: string;
}

type EventCallback<T> = (payload: T) => void | Promise<void>;

class TypedEventBus {
  private readonly handlers = new Map<string, EventCallback<unknown>[]>();

  on<K extends keyof PipelineEventMap>(
    event: K,
    callback: EventCallback<PipelineEventMap[K]>
  ): () => void {
    const list = this.handlers.get(event) ?? [];
    list.push(callback as EventCallback<unknown>);
    this.handlers.set(event, list);

    // Retorna unsubscribe
    return () => {
      const current = this.handlers.get(event) ?? [];
      this.handlers.set(
        event,
        current.filter((h) => h !== (callback as EventCallback<unknown>))
      );
    };
  }

  once<K extends keyof PipelineEventMap>(
    event: K,
    callback: EventCallback<PipelineEventMap[K]>
  ): void {
    const unsub = this.on(event, (payload) => {
      callback(payload);
      unsub();
    });
  }

  async emit<K extends keyof PipelineEventMap>(
    event: K,
    payload: PipelineEventMap[K]
  ): Promise<void> {
    const list = this.handlers.get(event) ?? [];
    for (const handler of list) {
      try {
        await handler(payload);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }
    }
  }

  off<K extends keyof PipelineEventMap>(event: K): void {
    this.handlers.delete(event);
  }
}

// Singleton global
export const eventBus = new TypedEventBus();
