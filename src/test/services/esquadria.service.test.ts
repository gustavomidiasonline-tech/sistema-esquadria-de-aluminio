import { describe, it, expect } from 'vitest';
import { EsquadriaService } from '@/services/esquadria.service';

describe('EsquadriaService', () => {
  describe('validarDimensoes', () => {
    it('deve retornar válido para dimensões corretas', () => {
      const result = EsquadriaService.validarDimensoes(1200, 1000);
      expect(result.valido).toBe(true);
      expect(result.erros).toHaveLength(0);
    });

    it('deve rejeitar largura menor que 300mm', () => {
      const result = EsquadriaService.validarDimensoes(200, 1000);
      expect(result.valido).toBe(false);
      expect(result.erros).toContain('Largura mínima: 300mm');
    });

    it('deve rejeitar altura zero', () => {
      const result = EsquadriaService.validarDimensoes(1000, 0);
      expect(result.valido).toBe(false);
    });

    it('deve rejeitar largura acima de 6000mm', () => {
      const result = EsquadriaService.validarDimensoes(7000, 1000);
      expect(result.valido).toBe(false);
    });
  });

  describe('calcularPerfis', () => {
    it('deve calcular peças para janela de correr 2F', () => {
      const pecas = EsquadriaService.calcularPerfis({
        modelo: 'correr',
        largura: 1200,
        altura: 1000,
      });

      expect(pecas).toBeDefined();
      expect(pecas.length).toBeGreaterThan(0);

      const marcoH = pecas.find((p) => p.posicao === 'marco_horizontal_superior');
      expect(marcoH).toBeDefined();
      expect(marcoH?.comprimento).toBe(1200);
    });

    it('deve calcular peças para janela fixa', () => {
      const pecas = EsquadriaService.calcularPerfis({
        modelo: 'fixo',
        largura: 600,
        altura: 800,
      });

      expect(pecas.length).toBe(4); // 4 peças para fixo
    });

    it('deve retornar peças com comprimentos positivos', () => {
      const pecas = EsquadriaService.calcularPerfis({
        modelo: 'basculante',
        largura: 1000,
        altura: 600,
      });

      for (const peca of pecas) {
        expect(peca.comprimento).toBeGreaterThan(0);
        expect(peca.quantidade).toBeGreaterThan(0);
      }
    });
  });

  describe('calcularListaMateriais', () => {
    it('deve somar total de metros de perfil', () => {
      const pecas = [
        { posicao: 'marco_h', comprimento: 1200, quantidade: 2 },
        { posicao: 'marco_v', comprimento: 1000, quantidade: 2 },
      ];

      const lista = EsquadriaService.calcularListaMateriais(pecas);

      // (1.2m * 2) + (1.0m * 2) = 4.4m
      expect(lista.totalPerfisMetros).toBe(4.4);
    });

    it('deve retornar todas as peças originais', () => {
      const pecas = EsquadriaService.calcularPerfis({
        modelo: 'correr',
        largura: 1200,
        altura: 1000,
      });

      const lista = EsquadriaService.calcularListaMateriais(pecas);
      expect(lista.pecas).toHaveLength(pecas.length);
    });
  });

  describe('calcularAreaVidro', () => {
    it('deve calcular área correta para 1 folha', () => {
      // largura=1200, altura=1000, folga=10 → (1180 * 980) / 1_000_000
      const area = EsquadriaService.calcularAreaVidro(1200, 1000, 1, 10);
      expect(area).toBeCloseTo(1.1564, 3);
    });

    it('deve calcular área para 2 folhas', () => {
      // 2 folhas de (600-20) * (1000-20) = 2 * 580 * 980 / 1_000_000
      const area = EsquadriaService.calcularAreaVidro(1200, 1000, 2, 10);
      expect(area).toBeCloseTo(1.1368, 3);
    });
  });
});
