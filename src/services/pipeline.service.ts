/**
 * PipelineService — Orquestrador do pipeline event-driven
 * quote.approved → generatePieces → optimizeCutting → checkInventory
 *                → createPurchaseOrder → createProductionOrder
 */

import { supabase } from '@/integrations/supabase/client';
import { CuttingService, type PecaCorte } from '@/services/cutting.service';
import { eventBus, type InventoryGap } from '@/services/eventBus';
import { pipelineError, databaseError } from '@/lib/error-handler';

export interface PipelineResult {
  cuttingPlanId: string;
  cuttingPlanNumero: string;
  inventoryGaps: InventoryGap[];
  purchaseOrderId: string | null;
  productionOrderId: string | null;
  productionOrderNumero: string | null;
}

export interface PipelineError {
  stage: string;
  message: string;
  orcamentoId: string;
}

export const PipelineService = {
  /**
   * Inicializa os listeners de eventos do pipeline.
   * Deve ser chamado uma única vez na inicialização da aplicação.
   */
  initialize(): () => void {
    const unsubQuote = eventBus.on('quote.approved', async ({ orcamentoId, companyId }) => {
      try {
        await PipelineService.runFullPipeline(orcamentoId, companyId);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await eventBus.emit('pipeline.error', {
          stage: 'pipeline.entry',
          error: message,
          context: { orcamentoId, companyId },
        });
      }
    });

    return () => {
      unsubQuote();
    };
  },

  /**
   * Executa o pipeline completo a partir de um orçamento aprovado.
   */
  async runFullPipeline(orcamentoId: string, companyId: string): Promise<PipelineResult> {
    // 1. Buscar itens do orçamento
    const { data: itensOrcamento, error: itensError } = await supabase
      .from('orcamento_itens')
      .select(`
        id,
        produto_id,
        largura,
        altura,
        quantidade,
        descricao
      `)
      .eq('orcamento_id', orcamentoId);

    if (itensError) throw databaseError(`Erro ao buscar itens: ${itensError.message}`, { service: 'pipeline', operation: 'runFullPipeline', entityId: orcamentoId });
    if (!itensOrcamento?.length) throw pipelineError('Orçamento sem itens', { service: 'pipeline', operation: 'runFullPipeline', entityId: orcamentoId });

    // 2. Gerar peças de corte a partir dos itens
    const pecas = gerarPecasDeCorte(itensOrcamento);

    // 3. Otimizar corte (FFD vs BFD — escolhe o melhor)
    const resultado = CuttingService.otimizarMelhor(pecas, 6000);

    // 4. Salvar plano de corte no banco
    const numeroPlan = await gerarNumeroCuttingPlan(companyId);
    const { data: cuttingPlan, error: planError } = await supabase
      .from('cutting_plans')
      .insert({
        company_id: companyId,
        orcamento_id: orcamentoId,
        numero: numeroPlan,
        algoritmo: resultado.algoritmo,
        aproveitamento_medio: resultado.aproveitamento_medio,
        total_barras: resultado.totalBarras,
        total_pecas: resultado.totalCortes,
        comprimento_barra_mm: 6000,
        status: 'gerado',
        barras_json: resultado.barras as unknown as Record<string, unknown>[],
      })
      .select('id')
      .single();

    if (planError) throw databaseError(`Erro ao salvar plano de corte: ${planError.message}`, { service: 'pipeline', operation: 'saveCuttingPlan' });
    const cuttingPlanId = cuttingPlan.id as string;

    await eventBus.emit('pieces.generated', {
      cuttingPlanId,
      totalPecas: resultado.totalCortes,
    });

    // 5. Salvar barras individuais
    const barrasInsert = resultado.barras.map((b) => ({
      cutting_plan_id: cuttingPlanId,
      numero_barra: b.numero,
      comprimento_total_mm: b.comprimentoTotal,
      sobra_mm: Math.round(b.sobra),
      aproveitamento_pct: b.aproveitamento,
      cortes: b.cortes as unknown as Record<string, unknown>[],
    }));

    await supabase.from('cutting_bars').insert(barrasInsert);

    await eventBus.emit('cutting.optimized', {
      cuttingPlanId,
      totalBarras: resultado.totalBarras,
      aproveitamento: resultado.aproveitamento_medio,
    });

    // 6. Verificar estoque
    const gaps = await PipelineService.checkInventory(cuttingPlanId, companyId, resultado.totalBarras);

    await eventBus.emit('inventory.checked', { cuttingPlanId, faltando: gaps });

    // 7. Criar pedido de compra se houver falta de material
    let purchaseOrderId: string | null = null;
    if (gaps.length > 0) {
      purchaseOrderId = await PipelineService.createPurchaseOrder(
        cuttingPlanId,
        companyId,
        gaps
      );
      await eventBus.emit('purchase.created', {
        purchaseOrderId,
        itens: gaps.length,
      });
    }

    // 8. Criar ordem de produção
    const { productionOrderId, numero: productionNumero } =
      await PipelineService.createProductionOrder(orcamentoId, cuttingPlanId, companyId);

    await eventBus.emit('production.created', {
      productionOrderId,
      numero: productionNumero,
    });

    return {
      cuttingPlanId,
      cuttingPlanNumero: numeroPlan,
      inventoryGaps: gaps,
      purchaseOrderId,
      productionOrderId,
      productionOrderNumero: productionNumero,
    };
  },

  /**
   * Verifica disponibilidade de estoque para o plano de corte.
   * Retorna lista de itens em falta.
   */
  async checkInventory(
    cuttingPlanId: string,
    companyId: string,
    totalBarras: number
  ): Promise<InventoryGap[]> {
    // Buscar estoque de perfis disponíveis
    const { data: estoqueItems } = await supabase
      .from('inventory_items')
      .select('id, codigo, nome, tipo, quantidade_disponivel, quantidade_minima, unidade')
      .eq('company_id', companyId)
      .eq('tipo', 'perfil');

    if (!estoqueItems?.length) {
      // Sem estoque cadastrado — reportar como gap genérico
      return [
        {
          codigo: 'PERFIL-GENERICO',
          nome: 'Perfil de Alumínio (sem estoque cadastrado)',
          tipo: 'perfil',
          necessario: totalBarras,
          disponivel: 0,
          faltando: totalBarras,
          unidade: 'barra',
        },
      ];
    }

    const gaps: InventoryGap[] = [];
    for (const item of estoqueItems) {
      const disponivel = (item.quantidade_disponivel as number) ?? 0;
      const minima = (item.quantidade_minima as number) ?? 0;
      if (disponivel < minima) {
        gaps.push({
          codigo: item.codigo as string,
          nome: item.nome as string,
          tipo: item.tipo as string,
          necessario: minima,
          disponivel,
          faltando: minima - disponivel,
          unidade: (item.unidade as string) ?? 'un',
        });
      }
    }

    return gaps;
  },

  /**
   * Cria pedido de compra automaticamente com base nos gaps de estoque.
   */
  async createPurchaseOrder(
    cuttingPlanId: string,
    companyId: string,
    gaps: InventoryGap[]
  ): Promise<string> {
    const numero = await gerarNumeroPurchaseOrder(companyId);

    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        company_id: companyId,
        cutting_plan_id: cuttingPlanId,
        numero,
        status: 'rascunho',
        gerado_automaticamente: true,
      })
      .select('id')
      .single();

    if (poError) throw databaseError(`Erro ao criar pedido de compra: ${poError.message}`, { service: 'pipeline', operation: 'createPurchaseOrder' });
    const purchaseOrderId = po.id as string;

    const itensInsert = gaps.map((gap) => ({
      purchase_order_id: purchaseOrderId,
      codigo_material: gap.codigo,
      descricao: gap.nome,
      quantidade: gap.faltando,
      unidade: gap.unidade,
    }));

    await supabase.from('purchase_order_items').insert(itensInsert);

    return purchaseOrderId;
  },

  /**
   * Cria ordem de produção associada ao orçamento aprovado.
   */
  async createProductionOrder(
    orcamentoId: string,
    cuttingPlanId: string,
    companyId: string
  ): Promise<{ productionOrderId: string; numero: string }> {
    // Buscar production_order criada pelo trigger (se existir)
    const { data: existing } = await supabase
      .from('production_orders')
      .select('id, numero')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing?.id) {
      // Atualizar com o cutting_plan_id
      await supabase
        .from('production_orders')
        .update({ plano_corte_gerado: true })
        .eq('id', existing.id as string);

      return {
        productionOrderId: existing.id as string,
        numero: existing.numero as string,
      };
    }

    // Criar manualmente se o trigger não criou
    const numero = await gerarNumeroOP(companyId);
    const { data: op, error: opError } = await supabase
      .from('production_orders')
      .insert({
        company_id: companyId,
        pedido_id: orcamentoId, // fallback — idealmente seria o pedido_id do pedido criado
        numero,
        status: 'pendente',
        plano_corte_gerado: true,
      })
      .select('id, numero')
      .single();

    if (opError) throw databaseError(`Erro ao criar ordem de produção: ${opError.message}`, { service: 'pipeline', operation: 'createProductionOrder' });

    return {
      productionOrderId: op.id as string,
      numero: op.numero as string,
    };
  },

  /**
   * Dispara o pipeline manualmente para um orçamento (usado pela UI).
   */
  async triggerForOrcamento(orcamentoId: string, companyId: string): Promise<PipelineResult> {
    return PipelineService.runFullPipeline(orcamentoId, companyId);
  },
};

// --- Helpers internos ---

function gerarPecasDeCorte(
  itens: Array<{
    id: string;
    largura?: number | null;
    altura?: number | null;
    quantidade?: number | null;
    descricao?: string | null;
  }>
): PecaCorte[] {
  const pecas: PecaCorte[] = [];

  for (const item of itens) {
    const largura = item.largura ?? 1000;
    const altura = item.altura ?? 1200;
    const quantidade = item.quantidade ?? 1;
    const nome = item.descricao ?? 'Esquadria';

    // Peças padrão: 2 marcos horizontais + 2 verticais + 4 folhas
    pecas.push(
      { id: `${item.id}_mh`, descricao: `${nome} - Marco H`, comprimento: largura, quantidade: 2 * quantidade },
      { id: `${item.id}_mv`, descricao: `${nome} - Marco V`, comprimento: altura, quantidade: 2 * quantidade },
      { id: `${item.id}_fh`, descricao: `${nome} - Folha H`, comprimento: Math.round(largura / 2) + 30, quantidade: 4 * quantidade },
      { id: `${item.id}_fv`, descricao: `${nome} - Folha V`, comprimento: altura - 80, quantidade: 4 * quantidade }
    );
  }

  return pecas;
}

async function gerarNumeroCuttingPlan(companyId: string): Promise<string> {
  const ano = new Date().getFullYear();
  const { count } = await supabase
    .from('cutting_plans')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId);
  const seq = String(((count ?? 0) + 1)).padStart(4, '0');
  return `CP-${ano}-${seq}`;
}

async function gerarNumeroPurchaseOrder(companyId: string): Promise<string> {
  const ano = new Date().getFullYear();
  const { count } = await supabase
    .from('purchase_orders')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId);
  const seq = String(((count ?? 0) + 1)).padStart(4, '0');
  return `PC-${ano}-${seq}`;
}

async function gerarNumeroOP(companyId: string): Promise<string> {
  const ano = new Date().getFullYear();
  const { count } = await supabase
    .from('production_orders')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId);
  const seq = String(((count ?? 0) + 1)).padStart(4, '0');
  return `OP-${ano}-${seq}`;
}
