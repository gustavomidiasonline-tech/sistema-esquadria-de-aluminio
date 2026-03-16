/**
 * ProductionService — Geração de ordens de produção
 * Lógica pura: sem dependências de React ou UI
 */

import { CuttingService, type PecaCorte, type ResultadoCorte } from '@/services/cutting.service';

export interface PedidoItem {
  id: string;
  produto_id: string;
  produto_nome: string;
  largura: number;
  altura: number;
  quantidade: number;
  modelo: string;
}

export interface EtapaProducao {
  ordem: number;
  nome: string;
  descricao: string;
  responsavel?: string;
  tempoPrevisto?: number;  // minutos
}

export interface OrdemProducao {
  numero: string;
  pedido_id: string;
  data_criacao: string;
  etapas: EtapaProducao[];
  itens: Array<{
    pedido_item_id: string;
    produto_nome: string;
    dimensoes: string;
    quantidade: number;
    pecas_necessarias: number;
  }>;
  status: 'pendente';
}

export interface PedidoCompra {
  ordem_producao_numero: string;
  itens: Array<{
    material: string;
    quantidade: number;
    unidade: string;
    urgencia: 'normal' | 'urgente';
  }>;
}

export const ProductionService = {
  /**
   * Gera ordem de produção a partir de um pedido aprovado
   */
  gerarOrdemDeProducao(pedidoId: string, itens: PedidoItem[]): OrdemProducao {
    const numero = gerarNumerOP();

    const etapas: EtapaProducao[] = [
      { ordem: 1, nome: 'Separação de Material', descricao: 'Separar perfis, vidros e ferragens do estoque', tempoPrevisto: 30 },
      { ordem: 2, nome: 'Plano de Corte', descricao: 'Executar cortes conforme plano otimizado', tempoPrevisto: 60 },
      { ordem: 3, nome: 'Montagem', descricao: 'Montar as esquadrias conforme especificação', tempoPrevisto: 90 },
      { ordem: 4, nome: 'Vidraçaria', descricao: 'Inserir vidros e selar', tempoPrevisto: 45 },
      { ordem: 5, nome: 'Ferragens', descricao: 'Instalar fechaduras, puxadores e trilhos', tempoPrevisto: 30 },
      { ordem: 6, nome: 'Controle de Qualidade', descricao: 'Verificar dimensões, acabamento e funcionamento', tempoPrevisto: 20 },
      { ordem: 7, nome: 'Embalagem', descricao: 'Embalar e identificar para entrega', tempoPrevisto: 15 },
    ];

    const itensMapeados = itens.map((item) => ({
      pedido_item_id: item.id,
      produto_nome: item.produto_nome,
      dimensoes: `${item.largura}mm × ${item.altura}mm`,
      quantidade: item.quantidade,
      pecas_necessarias: estimarPecasPorTipo(item.modelo, item.quantidade),
    }));

    return {
      numero,
      pedido_id: pedidoId,
      data_criacao: new Date().toISOString(),
      etapas,
      itens: itensMapeados,
      status: 'pendente',
    };
  },

  /**
   * Gera o plano de corte a partir dos itens de uma ordem de produção
   */
  gerarListaCorte(itensPedido: PedidoItem[], comprimentoBarra: number = 6000): ResultadoCorte {
    const pecas: PecaCorte[] = [];

    for (const item of itensPedido) {
      const pecasDoItem = gerarPecasParaCorte(item);
      pecas.push(...pecasDoItem);
    }

    return CuttingService.otimizarMelhor(pecas, comprimentoBarra);
  },

  /**
   * Gera pedido de compra baseado nas necessidades de produção
   */
  gerarPedidoCompra(ordemNumero: string, itensPedido: PedidoItem[]): PedidoCompra {
    const materiais: PedidoCompra['itens'] = [];

    // Estimar perfis necessários (aproximação — motor real usa window_parts)
    const totalPecas = itensPedido.reduce(
      (acc, item) => acc + estimarPecasPorTipo(item.modelo, item.quantidade),
      0
    );
    const totalMetrosPerfil = totalPecas * 0.8; // média 80cm por peça

    materiais.push({
      material: 'Perfil de Alumínio (geral)',
      quantidade: Math.ceil(totalMetrosPerfil / 6) * 6,  // múltiplo de 6m
      unidade: 'm',
      urgencia: 'normal',
    });

    // Vidro
    const totalAreaVidro = itensPedido.reduce(
      (acc, item) => acc + (item.largura * item.altura * item.quantidade) / 1_000_000,
      0
    );
    materiais.push({
      material: 'Vidro (m²)',
      quantidade: Math.ceil(totalAreaVidro * 1.1 * 100) / 100, // +10% folga
      unidade: 'm²',
      urgencia: 'normal',
    });

    return {
      ordem_producao_numero: ordemNumero,
      itens: materiais,
    };
  },
};

// --- Helpers internos ---

function gerarNumerOP(): string {
  const ano = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `OP-${ano}-${seq}`;
}

function estimarPecasPorTipo(modelo: string, quantidade: number): number {
  const pecasPorUnidade: Record<string, number> = {
    correr: 9,
    correr_2f: 9,
    correr_4f: 17,
    fixo: 4,
    'maxim-ar': 8,
    basculante: 5,
  };
  return (pecasPorUnidade[modelo.toLowerCase()] ?? 6) * quantidade;
}

function gerarPecasParaCorte(item: PedidoItem): PecaCorte[] {
  // Simplificado — motor real usaria window_parts do banco
  const { largura, altura, quantidade, modelo } = item;

  const base: Omit<PecaCorte, 'id'>[] = [
    { descricao: `${item.produto_nome} - Marco H`, comprimento: largura, quantidade: 2 * quantidade },
    { descricao: `${item.produto_nome} - Marco V`, comprimento: altura, quantidade: 2 * quantidade },
    { descricao: `${item.produto_nome} - Folha H`, comprimento: largura / 2 + 30, quantidade: 4 * quantidade },
    { descricao: `${item.produto_nome} - Folha V`, comprimento: altura - 80, quantidade: 4 * quantidade },
  ];

  return base.map((p, i) => ({ ...p, id: `${item.id}_peca_${i}` }));
}
