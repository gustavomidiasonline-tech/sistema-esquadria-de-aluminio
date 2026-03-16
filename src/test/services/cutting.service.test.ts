import { describe, it, expect } from 'vitest';
import { CuttingService } from '@/services/cutting.service';
import type { PecaCorte } from '@/services/cutting.service';

const pecasSimples: PecaCorte[] = [
  { id: 'p1', descricao: 'Marco H', comprimento: 1200, quantidade: 2 },
  { id: 'p2', descricao: 'Marco V', comprimento: 1000, quantidade: 2 },
  { id: 'p3', descricao: 'Folha H', comprimento: 600, quantidade: 4 },
  { id: 'p4', descricao: 'Folha V', comprimento: 920, quantidade: 4 },
];

describe('CuttingService', () => {
  describe('otimizarCortes com FFD', () => {
    it('deve retornar resultado com barras e cortes', () => {
      const resultado = CuttingService.otimizarCortes(pecasSimples, 6000, 'FFD');

      expect(resultado.barras).toBeDefined();
      expect(resultado.barras.length).toBeGreaterThan(0);
      expect(resultado.totalCortes).toBe(12); // 2+2+4+4 peças expandidas
    });

    it('deve ter aproveitamento entre 0 e 100%', () => {
      const resultado = CuttingService.otimizarCortes(pecasSimples, 6000, 'FFD');

      expect(resultado.aproveitamento_medio).toBeGreaterThan(0);
      expect(resultado.aproveitamento_medio).toBeLessThanOrEqual(100);
    });

    it('cada barra deve ter comprimento total correto', () => {
      const resultado = CuttingService.otimizarCortes(pecasSimples, 6000, 'FFD');

      for (const barra of resultado.barras) {
        expect(barra.comprimentoTotal).toBe(6000);
        expect(barra.sobra).toBeGreaterThanOrEqual(0);
      }
    });

    it('deve usar comprimento de barra personalizado', () => {
      const resultado = CuttingService.otimizarCortes(pecasSimples, 5800, 'FFD');

      for (const barra of resultado.barras) {
        expect(barra.comprimentoTotal).toBe(5800);
      }
    });
  });

  describe('otimizarCortes com BFD', () => {
    it('deve retornar resultado com BFD', () => {
      const resultado = CuttingService.otimizarCortes(pecasSimples, 6000, 'BFD');

      expect(resultado.algoritmo).toBe('BFD');
      expect(resultado.barras.length).toBeGreaterThan(0);
    });
  });

  describe('otimizarMelhor', () => {
    it('deve retornar o melhor resultado entre FFD e BFD', () => {
      const resultado = CuttingService.otimizarMelhor(pecasSimples, 6000);

      expect(['FFD', 'BFD']).toContain(resultado.algoritmo);
      expect(resultado.barras.length).toBeGreaterThan(0);
    });
  });

  describe('gerarRelatorioCorte', () => {
    it('deve gerar relatório estruturado', () => {
      const resultado = CuttingService.otimizarCortes(pecasSimples, 6000);
      const relatorio = CuttingService.gerarRelatorioCorte(resultado);

      expect(relatorio.resumo).toBeDefined();
      expect(relatorio.resumo.totalBarras).toBe(resultado.totalBarras);
      expect(relatorio.resumo.aproveitamentoMedio).toMatch(/%$/);
      expect(relatorio.barras).toHaveLength(resultado.totalBarras);
    });
  });

  describe('casos extremos', () => {
    it('deve lidar com peça única', () => {
      const resultado = CuttingService.otimizarCortes(
        [{ id: 'x', descricao: 'Peça', comprimento: 2000, quantidade: 1 }],
        6000
      );

      expect(resultado.totalBarras).toBe(1);
      expect(resultado.totalCortes).toBe(1);
    });

    it('deve criar nova barra quando peça não cabe', () => {
      const pecasGrandes: PecaCorte[] = [
        { id: 'a', descricao: 'Grande A', comprimento: 5990, quantidade: 2 },
      ];
      const resultado = CuttingService.otimizarCortes(pecasGrandes, 6000);

      expect(resultado.totalBarras).toBe(2); // cada uma ocupa barra inteira
    });
  });
});
