import { describe, it, expect } from 'vitest';
import { OrcamentoService } from '@/services/orcamento.service';
import type { OrcamentoItemInput, OrcamentoItem } from '@/services/orcamento.service';
import type { ConfigPrecos } from '@/services/pricing.service';

const configPadrao: ConfigPrecos = {
  preco_kg_aluminio: 35.0,
  preco_m2_vidro: 80.0,
  preco_hora_mao_obra: 60.0,
  frete_percentual: 5.0,
  impostos_percentual: 10.0,
};

const itemCorrer: OrcamentoItemInput = {
  produto_id: 'prod-1',
  produto_nome: 'Janela Correr 2F',
  largura: 1200,
  altura: 1000,
  quantidade: 1,
  modelo: 'correr_2f',
};

const itemFixo: OrcamentoItemInput = {
  produto_id: 'prod-2',
  produto_nome: 'Janela Fixa',
  largura: 800,
  altura: 600,
  quantidade: 2,
  modelo: 'fixo',
};

describe('OrcamentoService', () => {
  describe('gerarItem', () => {
    it('deve gerar item com preço unitário positivo', () => {
      const item = OrcamentoService.gerarItem(itemCorrer, configPadrao);

      expect(item.precoUnitario).toBeGreaterThan(0);
      expect(item.precoTotal).toBeGreaterThan(0);
    });

    it('deve preservar dimensões do input', () => {
      const item = OrcamentoService.gerarItem(itemCorrer, configPadrao);

      expect(item.largura).toBe(1200);
      expect(item.altura).toBe(1000);
      expect(item.quantidade).toBe(1);
    });

    it('deve calcular preçoTotal = preçoUnitario * quantidade', () => {
      const itemQtd2 = { ...itemCorrer, quantidade: 2 };
      const item1 = OrcamentoService.gerarItem(itemCorrer, configPadrao);
      const item2 = OrcamentoService.gerarItem(itemQtd2, configPadrao);

      expect(item2.precoTotal).toBeCloseTo(item1.precoUnitario * 2, 1);
    });

    it('deve incluir lista de materiais no item gerado', () => {
      const item = OrcamentoService.gerarItem(itemCorrer, configPadrao);

      expect(item.listaMateriais).toBeDefined();
      expect(item.listaMateriais.pecas.length).toBeGreaterThan(0);
      expect(item.listaMateriais.totalPerfisMetros).toBeGreaterThan(0);
    });

    it('deve aplicar margem padrão de 30% se não informada', () => {
      const item = OrcamentoService.gerarItem(itemCorrer, configPadrao);
      expect(item.margemAplicada).toBe(30);
    });

    it('deve aplicar margem customizada quando fornecida', () => {
      const item = OrcamentoService.gerarItem(itemCorrer, configPadrao, 45);
      expect(item.margemAplicada).toBe(45);
    });

    it('deve ter preço maior com margem maior', () => {
      const item30 = OrcamentoService.gerarItem(itemCorrer, configPadrao, 30);
      const item50 = OrcamentoService.gerarItem(itemCorrer, configPadrao, 50);

      expect(item50.precoUnitario).toBeGreaterThan(item30.precoUnitario);
    });
  });

  describe('gerarOrcamento', () => {
    it('deve gerar orçamento com totalVenda > totalCusto', () => {
      const orc = OrcamentoService.gerarOrcamento([itemCorrer, itemFixo], configPadrao);

      expect(orc.totalVenda).toBeGreaterThan(orc.totalCusto);
    });

    it('deve calcular totalLucro = totalVenda - totalCusto', () => {
      const orc = OrcamentoService.gerarOrcamento([itemCorrer, itemFixo], configPadrao);

      expect(orc.totalLucro).toBeCloseTo(orc.totalVenda - orc.totalCusto, 1);
    });

    it('deve retornar todos os itens gerados', () => {
      const orc = OrcamentoService.gerarOrcamento([itemCorrer, itemFixo], configPadrao);

      expect(orc.itens).toHaveLength(2);
    });

    it('deve ter margem média positiva', () => {
      const orc = OrcamentoService.gerarOrcamento([itemCorrer], configPadrao);

      expect(orc.margemMedia).toBeGreaterThan(0);
    });
  });

  describe('calcularTotalOrcamento', () => {
    it('deve somar precoTotal de todos os itens', () => {
      const item1 = OrcamentoService.gerarItem(itemCorrer, configPadrao);
      const item2 = OrcamentoService.gerarItem(itemFixo, configPadrao);

      const total = OrcamentoService.calcularTotalOrcamento([item1, item2]);

      expect(total).toBeCloseTo(item1.precoTotal + item2.precoTotal, 2);
    });

    it('deve retornar zero para lista vazia', () => {
      const total = OrcamentoService.calcularTotalOrcamento([]);
      expect(total).toBe(0);
    });
  });

  describe('validarOrcamento', () => {
    let itensMock: OrcamentoItem[];

    beforeEach(() => {
      itensMock = [OrcamentoService.gerarItem(itemCorrer, configPadrao)];
    });

    it('deve retornar válido com cliente e itens', () => {
      const result = OrcamentoService.validarOrcamento('cliente-123', itensMock);

      expect(result.valido).toBe(true);
      expect(result.erros).toHaveLength(0);
    });

    it('deve retornar inválido sem clienteId', () => {
      const result = OrcamentoService.validarOrcamento(undefined, itensMock);

      expect(result.valido).toBe(false);
      expect(result.erros).toContain('Cliente é obrigatório');
    });

    it('deve retornar inválido sem itens', () => {
      const result = OrcamentoService.validarOrcamento('cliente-123', []);

      expect(result.valido).toBe(false);
      expect(result.erros.length).toBeGreaterThan(0);
    });

    it('deve retornar inválido com item de largura zero', () => {
      const itemInvalido: OrcamentoItem = { ...itensMock[0], largura: 0 };
      const result = OrcamentoService.validarOrcamento('cliente-123', [itemInvalido]);

      expect(result.valido).toBe(false);
      expect(result.erros.some((e) => e.includes('largura'))).toBe(true);
    });
  });
});
