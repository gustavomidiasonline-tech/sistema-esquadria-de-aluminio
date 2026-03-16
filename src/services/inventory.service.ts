/**
 * InventoryService — Gestão de estoque para o pipeline de produção
 * Controla itens, reservas e alertas de estoque mínimo
 */

import { supabase } from '@/integrations/supabase/client';
import { inventoryError, databaseError, notFoundError } from '@/lib/error-handler';

export type InventoryItemTipo = 'perfil' | 'vidro' | 'ferragem' | 'acessorio' | 'outro';

export interface InventoryItem {
  id: string;
  company_id: string;
  codigo: string;
  nome: string;
  tipo: InventoryItemTipo;
  quantidade_disponivel: number;
  quantidade_reservada: number;
  quantidade_minima: number;
  unidade: string;
  localizacao?: string;
}

export interface InventoryMovement {
  item_id: string;
  tipo: 'entrada' | 'saida' | 'reserva' | 'liberacao';
  quantidade: number;
  referencia?: string;  // cutting_plan_id, purchase_order_id, etc.
}

export interface StockAlert {
  itemId: string;
  codigo: string;
  nome: string;
  disponivel: number;
  minimo: number;
  deficit: number;
}

export interface InventorySyncResult {
  inserted: number;
  updated: number;
  skipped: number;
}

export interface InventorySyncSummary {
  inserted: number;
  updated: number;
  skipped: number;
  byTipo: Record<InventoryItemTipo, InventorySyncResult>;
}

export const InventoryService = {
  /**
   * Lista todos os itens de estoque da empresa
   */
  async listarItens(companyId: string, tipo?: InventoryItemTipo): Promise<InventoryItem[]> {
    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('company_id', companyId)
      .order('tipo', { ascending: true })
      .order('nome', { ascending: true });

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;
    if (error) throw databaseError(`Erro ao listar estoque: ${error.message}`, { service: 'inventory', operation: 'listarItens' });
    return (data ?? []) as InventoryItem[];
  },

  /**
   * Busca item por código
   */
  async buscarPorCodigo(companyId: string, codigo: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('company_id', companyId)
      .eq('codigo', codigo)
      .single();

    if (error?.code === 'PGRST116') return null;
    if (error) throw databaseError(`Erro ao buscar item: ${error.message}`, { service: 'inventory', operation: 'buscarPorCodigo' });
    return data as InventoryItem;
  },

  /**
   * Cria ou atualiza um item de estoque (upsert por codigo+company_id)
   */
  async salvarItem(
    companyId: string,
    item: Omit<InventoryItem, 'id' | 'company_id'>
  ): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .upsert(
        { ...item, company_id: companyId },
        { onConflict: 'company_id,codigo' }
      )
      .select()
      .single();

    if (error) throw databaseError(`Erro ao salvar item: ${error.message}`, { service: 'inventory', operation: 'salvarItem' });
    return data as InventoryItem;
  },

  /**
   * Atualiza quantidade disponível (entrada ou saída de estoque)
   */
  async atualizarQuantidade(
    companyId: string,
    itemId: string,
    delta: number  // positivo = entrada, negativo = saída
  ): Promise<void> {
    const { data: current, error: fetchError } = await supabase
      .from('inventory_items')
      .select('quantidade_disponivel')
      .eq('id', itemId)
      .eq('company_id', companyId)
      .single();

    if (fetchError) throw notFoundError(`Item não encontrado: ${fetchError.message}`, { service: 'inventory' });

    const novaQtd = Math.max(0, (current.quantidade_disponivel as number) + delta);

    const { error } = await supabase
      .from('inventory_items')
      .update({ quantidade_disponivel: novaQtd })
      .eq('id', itemId)
      .eq('company_id', companyId);

    if (error) throw databaseError(`Erro ao atualizar quantidade: ${error.message}`, { service: 'inventory', operation: 'atualizarQuantidade' });
  },

  /**
   * Reserva quantidade para uma ordem de produção
   */
  async reservar(companyId: string, itemId: string, quantidade: number): Promise<void> {
    const { data: current, error: fetchError } = await supabase
      .from('inventory_items')
      .select('quantidade_disponivel, quantidade_reservada')
      .eq('id', itemId)
      .eq('company_id', companyId)
      .single();

    if (fetchError) throw notFoundError(`Item não encontrado: ${fetchError.message}`, { service: 'inventory' });

    const disponivel = current.quantidade_disponivel as number;
    if (disponivel < quantidade) {
      throw inventoryError(`Estoque insuficiente: disponível ${disponivel}, necessário ${quantidade}`, { service: 'inventory', operation: 'reservar' });
    }

    const { error } = await supabase
      .from('inventory_items')
      .update({
        quantidade_disponivel: disponivel - quantidade,
        quantidade_reservada: (current.quantidade_reservada as number) + quantidade,
      })
      .eq('id', itemId)
      .eq('company_id', companyId);

    if (error) throw databaseError(`Erro ao reservar: ${error.message}`, { service: 'inventory', operation: 'reservar' });
  },

  /**
   * Libera reserva de volta para disponível
   */
  async liberarReserva(companyId: string, itemId: string, quantidade: number): Promise<void> {
    const { data: current, error: fetchError } = await supabase
      .from('inventory_items')
      .select('quantidade_disponivel, quantidade_reservada')
      .eq('id', itemId)
      .eq('company_id', companyId)
      .single();

    if (fetchError) throw notFoundError(`Item não encontrado: ${fetchError.message}`, { service: 'inventory' });

    const reservada = current.quantidade_reservada as number;
    const liberando = Math.min(quantidade, reservada);

    const { error } = await supabase
      .from('inventory_items')
      .update({
        quantidade_disponivel: (current.quantidade_disponivel as number) + liberando,
        quantidade_reservada: reservada - liberando,
      })
      .eq('id', itemId)
      .eq('company_id', companyId);

    if (error) throw databaseError(`Erro ao liberar reserva: ${error.message}`, { service: 'inventory', operation: 'liberarReserva' });
  },

  /**
   * Retorna itens abaixo do estoque mínimo (alertas)
   */
  async getAlertasEstoque(companyId: string): Promise<StockAlert[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id, codigo, nome, quantidade_disponivel, quantidade_minima')
      .eq('company_id', companyId)
      .filter('quantidade_disponivel', 'lt', 'quantidade_minima');

    if (error) throw databaseError(`Erro ao buscar alertas: ${error.message}`, { service: 'inventory', operation: 'getAlertasEstoque' });

    return (data ?? []).map((item) => ({
      itemId: item.id as string,
      codigo: item.codigo as string,
      nome: item.nome as string,
      disponivel: item.quantidade_disponivel as number,
      minimo: item.quantidade_minima as number,
      deficit: (item.quantidade_minima as number) - (item.quantidade_disponivel as number),
    }));
  },

  /**
   * Importa lista de itens em lote (de um pedido de compra recebido)
   */
  async importarLote(
    companyId: string,
    itens: Array<{ codigo: string; nome: string; tipo: InventoryItemTipo; quantidade: number; unidade: string }>
  ): Promise<void> {
    for (const item of itens) {
      const existing = await InventoryService.buscarPorCodigo(companyId, item.codigo);
      if (existing) {
        await InventoryService.atualizarQuantidade(companyId, existing.id, item.quantidade);
      } else {
        await InventoryService.salvarItem(companyId, {
          codigo: item.codigo,
          nome: item.nome,
          tipo: item.tipo,
          quantidade_disponivel: item.quantidade,
          quantidade_reservada: 0,
          quantidade_minima: 0,
          unidade: item.unidade,
        });
      }
    }
  },

  /**
   * Sincroniza perfis de aluminio (por produto) com o estoque.
   * Cria itens faltantes e vincula itens existentes via perfil_aluminio_id.
   */
  async sincronizarPerfisDeProdutos(companyId: string): Promise<InventorySyncResult> {
    return syncSourceToInventory({
      companyId,
      tipo: 'perfil',
      sourceTable: 'perfis_aluminio',
      sourceIdField: 'perfil_aluminio_id',
      sourceSelect: 'id, codigo, nome',
      defaultUnidade: 'barra',
    });
  },

  /**
   * Sincroniza perfis, vidros, ferragens e acessorios com o estoque.
   */
  async sincronizarMateriaisDeProdutos(companyId: string): Promise<InventorySyncSummary> {
    const baseSummary: InventorySyncSummary = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      byTipo: {
        perfil: { inserted: 0, updated: 0, skipped: 0 },
        vidro: { inserted: 0, updated: 0, skipped: 0 },
        ferragem: { inserted: 0, updated: 0, skipped: 0 },
        acessorio: { inserted: 0, updated: 0, skipped: 0 },
        outro: { inserted: 0, updated: 0, skipped: 0 },
      },
    };

    const perfil = await InventoryService.sincronizarPerfisDeProdutos(companyId);
    baseSummary.byTipo.perfil = perfil;

    const vidro = await syncSourceToInventory({
      companyId,
      tipo: 'vidro',
      sourceTable: 'glass_types',
      sourceIdField: 'glass_type_id',
      sourceSelect: 'id, codigo, nome',
      defaultUnidade: 'm2',
    });
    baseSummary.byTipo.vidro = vidro;

    const ferragem = await syncSourceToInventory({
      companyId,
      tipo: 'ferragem',
      sourceTable: 'hardware',
      sourceIdField: 'hardware_id',
      sourceSelect: 'id, codigo, nome, unidade',
      defaultUnidade: 'un',
      sourceUnidadeField: 'unidade',
    });
    baseSummary.byTipo.ferragem = ferragem;

    const acessorio = await syncSourceToInventory({
      companyId,
      tipo: 'acessorio',
      sourceTable: 'accessories',
      sourceIdField: 'accessory_id',
      sourceSelect: 'id, codigo, nome, unidade',
      defaultUnidade: 'un',
      sourceUnidadeField: 'unidade',
    });
    baseSummary.byTipo.acessorio = acessorio;

    const totals = Object.values(baseSummary.byTipo);
    baseSummary.inserted = totals.reduce((sum, v) => sum + v.inserted, 0);
    baseSummary.updated = totals.reduce((sum, v) => sum + v.updated, 0);
    baseSummary.skipped = totals.reduce((sum, v) => sum + v.skipped, 0);

    return baseSummary;
  },
};

type SyncSourceConfig = {
  companyId: string;
  tipo: InventoryItemTipo;
  sourceTable: 'perfis_aluminio' | 'glass_types' | 'hardware' | 'accessories';
  sourceIdField: 'perfil_aluminio_id' | 'glass_type_id' | 'hardware_id' | 'accessory_id';
  sourceSelect: string;
  sourceUnidadeField?: 'unidade';
  defaultUnidade: string;
};

async function syncSourceToInventory(config: SyncSourceConfig): Promise<InventorySyncResult> {
  const {
    companyId,
    tipo,
    sourceTable,
    sourceIdField,
    sourceSelect,
    sourceUnidadeField,
    defaultUnidade,
  } = config;

  const { data: source, error: sourceError } = await supabase
    .from(sourceTable)
    .select(sourceSelect)
    .eq('company_id', companyId);

  if (sourceError) {
    throw databaseError(`Erro ao buscar fonte ${sourceTable}: ${sourceError.message}`, { service: 'inventory', operation: 'syncSourceToInventory' });
  }

  if (!source?.length) {
    return { inserted: 0, updated: 0, skipped: 0 };
  }

  const { data: existentes, error: existentesError } = await supabase
    .from('inventory_items')
    .select(`id, codigo, nome, ${sourceIdField}`)
    .eq('company_id', companyId)
    .eq('tipo', tipo);

  if (existentesError) {
    throw databaseError(`Erro ao buscar itens de estoque: ${existentesError.message}`, { service: 'inventory', operation: 'syncSourceToInventory' });
  }

  const existentesPorCodigo = new Map<string, { id: string; source_id: string | null; nome: string }>();
  const existentesPorSource = new Map<string, { id: string; source_id: string | null; nome: string }>();

  (existentes ?? []).forEach((item) => {
    const registro = {
      id: item.id as string,
      source_id: (item[sourceIdField] as string | null) ?? null,
      nome: item.nome as string,
    };
    existentesPorCodigo.set((item.codigo as string).toUpperCase(), registro);
    if (item[sourceIdField]) {
      existentesPorSource.set(item[sourceIdField] as string, registro);
    }
  });

  const inserts: Array<Record<string, unknown>> = [];
  const updates: Array<{ id: string; nome: string; source_id: string }> = [];
  let skipped = 0;

  for (const src of source) {
    const sourceId = src.id as string;
    const codigo = String(src.codigo ?? '').trim();
    const nome = String(src.nome ?? '').trim();
    const unidade = sourceUnidadeField ? String(src[sourceUnidadeField] ?? '').trim() : '';
    const finalUnidade = unidade || defaultUnidade;

    if (!codigo || !nome) {
      skipped += 1;
      continue;
    }

    const existingBySource = existentesPorSource.get(sourceId);
    if (existingBySource) {
      if (existingBySource.nome !== nome) {
        updates.push({ id: existingBySource.id, nome, source_id: sourceId });
      } else {
        skipped += 1;
      }
      continue;
    }

    const existingByCodigo = existentesPorCodigo.get(codigo.toUpperCase());
    if (existingByCodigo) {
      if (!existingByCodigo.source_id || existingByCodigo.nome !== nome) {
        updates.push({ id: existingByCodigo.id, nome, source_id: sourceId });
      } else {
        skipped += 1;
      }
      continue;
    }

    inserts.push({
      company_id: companyId,
      tipo,
      codigo,
      nome,
      unidade: finalUnidade,
      quantidade_disponivel: 0,
      quantidade_reservada: 0,
      quantidade_minima: 0,
      [sourceIdField]: sourceId,
    });
  }

  if (inserts.length > 0) {
    const { error: insertError } = await supabase.from('inventory_items').insert(inserts);
    if (insertError) {
      throw databaseError(`Erro ao inserir itens: ${insertError.message}`, { service: 'inventory', operation: 'syncSourceToInventory' });
    }
  }

  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ nome: update.nome, [sourceIdField]: update.source_id })
      .eq('id', update.id)
      .eq('company_id', companyId);

    if (updateError) {
      throw databaseError(`Erro ao atualizar item: ${updateError.message}`, { service: 'inventory', operation: 'syncSourceToInventory' });
    }
  }

  return {
    inserted: inserts.length,
    updated: updates.length,
    skipped,
  };
}
