import { describe, it, expect } from 'vitest';
import { ProductionService } from '@/services/production.service';
import type { PedidoItem } from '@/services/production.service';

const itensPedido: PedidoItem[] = [
  {
    id: 'item-1',
    produto_id: 'prod-1',
    produto_nome: 'Janela Correr 2F',
    largura: 1200,
    altura: 1000,
    quantidade: 2,
    modelo: 'correr_2f',
  },
  {
    id: 'item-2',
    produto_id: 'prod-2',
    produto_nome: 'Janela Fixa',
    largura: 800,
    altura: 600,
    quantidade: 1,
    modelo: 'fixo',
  },
];

describe('ProductionService', () => {
  describe('gerarOrdemDeProducao', () => {
    it('deve gerar número de OP no formato OP-YYYY-XXXX', () => {
      const ordem = ProductionService.gerarOrdemDeProducao('pedido-1', itensPedido);

      expect(ordem.numero).toMatch(/^OP-\d{4}-\d{4}$/);
    });

    it('deve retornar exatamente 7 etapas padrão', () => {
      const ordem = ProductionService.gerarOrdemDeProducao('pedido-1', itensPedido);

      expect(ordem.etapas).toHaveLength(7);
    });

    it('deve incluir etapas com ordem sequencial (1 a 7)', () => {
      const ordem = ProductionService.gerarOrdemDeProducao('pedido-1', itensPedido);

      const ordens = ordem.etapas.map((e) => e.ordem);
      expect(ordens).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('deve mapear itens do pedido corretamente', () => {
      const ordem = ProductionService.gerarOrdemDeProducao('pedido-1', itensPedido);

      expect(ordem.itens).toHaveLength(2);
      expect(ordem.itens[0].produto_nome).toBe('Janela Correr 2F');
      expect(ordem.itens[0].dimensoes).toBe('1200mm × 1000mm');
    });

    it('deve retornar status pendente', () => {
      const ordem = ProductionService.gerarOrdemDeProducao('pedido-1', itensPedido);

      expect(ordem.status).toBe('pendente');
    });

    it('deve vincular pedido_id corretamente', () => {
      const ordem = ProductionService.gerarOrdemDeProducao('pedido-abc', itensPedido);

      expect(ordem.pedido_id).toBe('pedido-abc');
    });
  });

  describe('gerarListaCorte', () => {
    it('deve retornar ResultadoCorte com barras definidas', () => {
      const resultado = ProductionService.gerarListaCorte(itensPedido);

      expect(resultado.barras).toBeDefined();
      expect(resultado.barras.length).toBeGreaterThan(0);
    });

    it('deve ter aproveitamento válido (0-100%)', () => {
      const resultado = ProductionService.gerarListaCorte(itensPedido);

      expect(resultado.aproveitamento_medio).toBeGreaterThan(0);
      expect(resultado.aproveitamento_medio).toBeLessThanOrEqual(100);
    });

    it('deve usar comprimento de barra padrão 6000mm', () => {
      const resultado = ProductionService.gerarListaCorte(itensPedido);

      for (const barra of resultado.barras) {
        expect(barra.comprimentoTotal).toBe(6000);
      }
    });

    it('deve aceitar comprimento de barra personalizado', () => {
      const resultado = ProductionService.gerarListaCorte(itensPedido, 5800);

      for (const barra of resultado.barras) {
        expect(barra.comprimentoTotal).toBe(5800);
      }
    });
  });

  describe('gerarPedidoCompra', () => {
    it('deve incluir material de alumínio', () => {
      const pedido = ProductionService.gerarPedidoCompra('OP-2026-1234', itensPedido);

      const aluminio = pedido.itens.find((i) => i.material.includes('Alumínio') || i.material.includes('aluminio'));
      expect(aluminio).toBeDefined();
    });

    it('deve incluir material de vidro', () => {
      const pedido = ProductionService.gerarPedidoCompra('OP-2026-1234', itensPedido);

      const vidro = pedido.itens.find((i) => i.material.includes('Vidro') || i.material.includes('vidro'));
      expect(vidro).toBeDefined();
    });

    it('deve ter quantidades positivas em todos os itens', () => {
      const pedido = ProductionService.gerarPedidoCompra('OP-2026-1234', itensPedido);

      for (const item of pedido.itens) {
        expect(item.quantidade).toBeGreaterThan(0);
      }
    });

    it('deve vincular número da ordem de produção', () => {
      const pedido = ProductionService.gerarPedidoCompra('OP-2026-9999', itensPedido);

      expect(pedido.ordem_producao_numero).toBe('OP-2026-9999');
    });
  });
});
