import { supabase } from '@/integrations/supabase/client';
import type { ConfiguredItem } from '@/components/orcamentos/ItemConfigurator';
import type { Tables } from '@/integrations/supabase/types';

export type OrcamentoItem = Tables<'orcamento_itens'>;
export type Orcamento = Tables<'orcamentos'>;

// ─────────────────────────────────────────────────────────────────────────────
// Backward-compatible aliases (used by index.ts, tests, legacy imports)
// ─────────────────────────────────────────────────────────────────────────────
export interface OrcamentoItemInput {
  produto_id: string;
  produto_nome: string;
  largura: number;
  altura: number;
  quantidade: number;
  modelo?: string;
  margem?: number;
}

export interface OrcamentoGerado {
  itens: OrcamentoItem[];
  totalVenda: number;
  totalCusto: number;
  totalLucro: number;
  margemMedia: number;
}

export const OrcamentoService = {
  /**
   * Recalcular total de um orçamento baseado em seus itens
   */
  async recalcularTotal(orcId: string, itens: Partial<OrcamentoItem>[], excludeId?: string, addValue = 0): Promise<number> {
    const total = itens
      .filter((i) => i.orcamento_id === orcId && i.id !== excludeId)
      .reduce((sum, i) => sum + (i.valor_total || 0), addValue);

    await supabase.from('orcamentos').update({ valor_total: total }).eq('id', orcId);
    return total;
  },

  /**
   * Adicionar item ao orçamento
   */
  async adicionarItem(orcId: string, itemData: Omit<OrcamentoItem, 'id' | 'orcamento_id' | 'created_at'>, companyId?: string | null): Promise<OrcamentoItem> {
    // Integer Guard: Rounding fields that are INTEGER in DB
    const sanitizedItem = {
      ...itemData,
      orcamento_id: orcId,
      quantidade: Math.round(itemData.quantidade || 1),
      largura: itemData.largura ? Math.round(itemData.largura) : null,
      altura: itemData.altura ? Math.round(itemData.altura) : null,
      ...(companyId ? { company_id: companyId } : {}),
    };

    const { data, error } = await supabase
      .from('orcamento_itens')
      .insert(sanitizedItem as any)
      .select()
      .single();

    if (error) throw new Error(`Erro ao adicionar item: ${error.message}`);
    if (!data) throw new Error('Item não foi criado');

    // Recalcular total
    await this.recalcularTotal(orcId, [data], undefined, data.valor_total);

    return data;
  },

  /**
   * Deletar item do orçamento
   */
  async deletarItem(itemId: string, orcId: string, itemValue: number): Promise<void> {
    const { error } = await supabase.from('orcamento_itens').delete().eq('id', itemId);

    if (error) throw new Error(`Erro ao deletar item: ${error.message}`);

    // Recalcular (subtrair valor)
    await this.recalcularTotal(orcId, [], itemId, -itemValue);
  },

  /**
   * Adicionar item calculado (do ItemConfigurator)
   */
  async adicionarItemCalculado(orcId: string, item: ConfiguredItem, companyId?: string | null): Promise<void> {
    // Integer Guard: Rounding fields that are INTEGER in DB
    const sanitizedItem = {
      orcamento_id: orcId,
      ...item,
      quantidade: Math.round(item.quantidade || 1),
      largura: item.largura ? Math.round(item.largura) : null,
      altura: item.altura ? Math.round(item.altura) : null,
      ...(companyId ? { company_id: companyId } : {}),
    } as any;

    const { error } = await supabase
      .from('orcamento_itens')
      .insert(sanitizedItem);

    if (error) throw new Error(`Erro ao adicionar item calculado: ${error.message}`);

    // Recalcular
    await this.recalcularTotal(orcId, [sanitizedItem], undefined, item.valor_total);
  },

  /**
   * Validar item obrigatório
   */
  validateItemForm(descricao?: string, valorUnitario?: string): { valid: boolean; error?: string } {
    if (!descricao?.trim()) {
      return { valid: false, error: 'Descrição é obrigatória' };
    }
    if (!valorUnitario || isNaN(Number(valorUnitario))) {
      return { valid: false, error: 'Valor unitário é obrigatório' };
    }
    return { valid: true };
  },

  /**
   * Gerar Ordem de Produção (OP) a partir de orçamento
   */
  async gerarOP(orcId: string, companyId: string): Promise<string> {
    // Buscar orçamento
    const { data: orc, error: orcError } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', orcId)
      .single();

    if (orcError) throw new Error(`Orçamento não encontrado: ${orcError.message}`);
    if (!orc) throw new Error('Orçamento não encontrado');

    // Buscar itens
    const { data: itens, error: itensError } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', orcId);

    if (itensError) throw new Error(`Erro ao buscar itens: ${itensError.message}`);

    // Criar Ordem de Produção
    const { data: op, error: opError } = await supabase
      .from('pedidos')
      .insert({
        company_id: companyId,
        cliente_id: orc.cliente_id,
        descricao: `OP de ${orc.descricao || 'Orçamento'}`,
        status: 'planejamento',
        valor_total: orc.valor_total,
        origem_orcamento_id: orcId,
      } as any)
      .select()
      .single();

    if (opError) throw new Error(`Erro ao gerar OP: ${opError.message}`);
    if (!op) throw new Error('OP não foi criada');

    // Copiar itens para a OP
    if (itens && itens.length > 0) {
      const opItens = itens.map((item: any) => ({
        pedido_id: op.id,
        company_id: companyId,
        descricao: item.descricao,
        quantidade: Math.round(item.quantidade || 1), // Integer Guard
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        largura: item.largura ? Math.round(item.largura) : null, // Integer Guard
        altura: item.altura ? Math.round(item.altura) : null, // Integer Guard
        produto_id: item.produto_id,
      }));

      const { error: itemsError } = await supabase.from('pedido_itens').insert(opItens as any);

      if (itemsError) {
        // Rollback: deletar OP criada
        await supabase.from('pedidos').delete().eq('id', op.id);
        throw new Error(`Erro ao copiar itens: ${itemsError.message}`);
      }
    }

    // Atualizar status do orçamento
    await supabase
      .from('orcamentos')
      .update({ status: 'convertido_em_op' } as any)
      .eq('id', orcId);

    return op.id;
  },

  /**
   * Atualizar status do orçamento
   */
  async atualizarStatus(orcId: string, novoStatus: string): Promise<void> {
    const { error } = await supabase
      .from('orcamentos')
      .update({ status: novoStatus } as any)
      .eq('id', orcId);

    if (error) throw new Error(`Erro ao atualizar status: ${error.message}`);
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Backward-compatible stub methods used by legacy tests / pipeline service
  // These are not connected to Supabase — they use local calculation only.
  // ─────────────────────────────────────────────────────────────────────────
  gerarItem(input: OrcamentoItemInput, _config: unknown, margem = 30): OrcamentoItem & { precoUnitario: number; precoTotal: number; margemAplicada: number; listaMateriais: { pecas: unknown[]; totalPerfisMetros: number } } {
    const area = (input.largura / 1000) * (input.altura / 1000);
    const custoBase = area * 150; // R$150/m² base estimate
    const precoUnitario = Math.round((custoBase * (1 + margem / 100)) * 100) / 100;
    const precoTotal = precoUnitario * input.quantidade;

    return {
      id: '',
      orcamento_id: '',
      created_at: new Date().toISOString(),
      descricao: input.produto_nome,
      quantidade: input.quantidade,
      largura: input.largura,
      altura: input.altura,
      valor_unitario: precoUnitario,
      valor_total: precoTotal,
      produto_id: input.produto_id,
      tipo_vidro: null,
      markup_percentual: margem,
      custo_aluminio: null,
      custo_vidro: null,
      custo_ferragem: null,
      custo_acessorios: null,
      custo_mao_obra: null,
      custo_total: custoBase,
      lucro: precoTotal - custoBase * input.quantidade,
      peso_total_kg: null,
      area_vidro_m2: null,
      precoUnitario,
      precoTotal,
      margemAplicada: margem,
      listaMateriais: { pecas: [], totalPerfisMetros: area * 4 },
    } as any;
  },

  gerarOrcamento(itens: OrcamentoItemInput[], config: unknown, margem = 30): OrcamentoGerado {
    const gerados = itens.map((i) => this.gerarItem(i, config, margem));
    const totalVenda = gerados.reduce((s, i) => s + i.precoTotal, 0);
    const totalCusto = gerados.reduce((s, i) => s + (i.custo_total || 0) * i.quantidade, 0);
    return {
      itens: gerados,
      totalVenda,
      totalCusto,
      totalLucro: totalVenda - totalCusto,
      margemMedia: margem,
    };
  },

  calcularTotalOrcamento(itens: (OrcamentoItem & { precoTotal?: number })[]): number {
    return itens.reduce((sum, i) => sum + (i.precoTotal ?? i.valor_total ?? 0), 0);
  },

  validarOrcamento(clienteId: string | undefined, itens: OrcamentoItem[]): { valido: boolean; erros: string[] } {
    const erros: string[] = [];
    if (!clienteId) erros.push('Cliente é obrigatório');
    if (!itens || itens.length === 0) erros.push('Nenhum item adicionado ao orçamento');
    for (const item of itens) {
      if (!item.largura || item.largura <= 0) erros.push(`Item "${item.descricao}": largura inválida`);
      if (!item.altura || item.altura <= 0) erros.push(`Item "${item.descricao}": altura inválida`);
    }
    return { valido: erros.length === 0, erros };
  },
};
