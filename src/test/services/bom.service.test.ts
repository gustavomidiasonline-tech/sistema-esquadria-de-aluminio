import { describe, it, expect } from 'vitest';
import { BOMService } from '@/services/bom.service';
import type { BOMResult } from '@/services/bom.service';

describe('BOMService', () => {
  describe('evaluateFormula', () => {
    it('should evaluate simple largura formula', () => {
      // largura in mm, formula uses meters: l = largura/1000
      const result = BOMService.evaluateFormula('largura', 2000, 1500);
      expect(result).toBe(2); // 2000/1000 = 2
    });

    it('should evaluate simple altura formula', () => {
      const result = BOMService.evaluateFormula('altura', 2000, 1500);
      expect(result).toBe(1.5); // 1500/1000 = 1.5
    });

    it('should evaluate arithmetic expressions', () => {
      const result = BOMService.evaluateFormula('(largura + altura) * 2', 1000, 1200);
      // l=1, a=1.2 => (1 + 1.2) * 2 = 4.4
      expect(result).toBeCloseTo(4.4);
    });

    it('should evaluate multiplication', () => {
      const result = BOMService.evaluateFormula('largura * altura', 2000, 3000);
      // l=2, a=3 => 6
      expect(result).toBe(6);
    });

    it('should evaluate division formula', () => {
      const result = BOMService.evaluateFormula('(largura * altura) / 1000000', 2000, 3000);
      // l=2, a=3 => (2*3)/1000000 => this evaluates as the replaced string
      // Actually: l=2, a=3, expression becomes (2 * 3) / 1000000 = 0.000006
      // Wait, the formula replaces 'largura' with l=largura/1000 and 'altura' with a=altura/1000
      // So (2 * 3) / 1000000 = 0.000006
      expect(result).toBeCloseTo(0.000006);
    });

    it('should return 0 for invalid formula', () => {
      const result = BOMService.evaluateFormula('invalid()', 1000, 1000);
      expect(result).toBe(0);
    });

    it('should evaluate constant formulas', () => {
      const result = BOMService.evaluateFormula('4', 1000, 1000);
      expect(result).toBe(4);
    });

    it('should handle altura * 2', () => {
      const result = BOMService.evaluateFormula('altura * 2', 1000, 1500);
      // a = 1.5 => 1.5 * 2 = 3
      expect(result).toBe(3);
    });
  });

  describe('getComponentesPadrao', () => {
    it('should return correr components for "correr" category', () => {
      const componentes = BOMService.getComponentesPadrao('correr');
      expect(componentes.length).toBe(9);
      expect(componentes[0].nome).toBe('Trilho superior');
    });

    it('should return correr components for "deslizante" category', () => {
      const componentes = BOMService.getComponentesPadrao('deslizante');
      expect(componentes.length).toBe(9);
    });

    it('should return basculante components', () => {
      const componentes = BOMService.getComponentesPadrao('basculante');
      expect(componentes.length).toBe(5);
    });

    it('should return porta components', () => {
      const componentes = BOMService.getComponentesPadrao('porta');
      expect(componentes.length).toBe(6);
    });

    it('should return maxim-ar components', () => {
      const componentes = BOMService.getComponentesPadrao('maxim-ar');
      expect(componentes.length).toBe(4);
    });

    it('should return default components for unknown category', () => {
      const componentes = BOMService.getComponentesPadrao('fixo');
      expect(componentes.length).toBe(3);
    });

    it('should have correct categories on components', () => {
      const componentes = BOMService.getComponentesPadrao('correr');
      const categorias = componentes.map((c) => c.categoria);
      expect(categorias).toContain('aluminio');
      expect(categorias).toContain('vidro');
      expect(categorias).toContain('ferragem');
      expect(categorias).toContain('borracha');
    });
  });

  describe('calcularBOM', () => {
    it('should calculate BOM for a correr item', () => {
      const result = BOMService.calcularBOM({
        id: 'item-1',
        descricao: 'Janela de correr 2 folhas',
        largura: 2000,
        altura: 1500,
        quantidade: 1,
      });

      expect(result.orcamento_item_id).toBe('item-1');
      expect(result.largura).toBe(2000);
      expect(result.altura).toBe(1500);
      expect(result.materiais.length).toBe(9);
    });

    it('should use default dimensions when null', () => {
      const result = BOMService.calcularBOM({
        id: 'item-2',
        descricao: 'fixo',
        largura: null,
        altura: null,
        quantidade: 1,
      });

      expect(result.largura).toBe(1000);
      expect(result.altura).toBe(1200);
    });

    it('should multiply quantities', () => {
      const single = BOMService.calcularBOM({
        id: 'item-3',
        descricao: 'fixo',
        largura: 1000,
        altura: 1000,
        quantidade: 1,
      });

      const double = BOMService.calcularBOM({
        id: 'item-4',
        descricao: 'fixo',
        largura: 1000,
        altura: 1000,
        quantidade: 2,
      });

      for (let i = 0; i < single.materiais.length; i++) {
        expect(double.materiais[i].quantidade).toBeCloseTo(
          single.materiais[i].quantidade * 2,
          2
        );
      }
    });

    it('should include formula in each material', () => {
      const result = BOMService.calcularBOM({
        id: 'item-5',
        descricao: 'porta',
        largura: 900,
        altura: 2100,
        quantidade: 1,
      });

      for (const mat of result.materiais) {
        expect(mat.formula).toBeDefined();
        expect(typeof mat.formula).toBe('string');
      }
    });
  });

  describe('agregarMateriais', () => {
    it('should aggregate materials from multiple BOMs', () => {
      const bom1: BOMResult = {
        orcamento_item_id: '1',
        descricao: 'fixo',
        largura: 1000,
        altura: 1000,
        quantidade: 1,
        materiais: [
          { nome: 'Perfil aluminio', categoria: 'aluminio', quantidade: 4, unidade: 'metro', formula: '(largura + altura) * 2 / 1000' },
          { nome: 'Vidro', categoria: 'vidro', quantidade: 1, unidade: 'm2', formula: '(largura * altura) / 1000000' },
        ],
      };

      const bom2: BOMResult = {
        orcamento_item_id: '2',
        descricao: 'fixo',
        largura: 1000,
        altura: 1000,
        quantidade: 1,
        materiais: [
          { nome: 'Perfil aluminio', categoria: 'aluminio', quantidade: 4, unidade: 'metro', formula: '(largura + altura) * 2 / 1000' },
          { nome: 'Vidro', categoria: 'vidro', quantidade: 1, unidade: 'm2', formula: '(largura * altura) / 1000000' },
        ],
      };

      const aggregated = BOMService.agregarMateriais([bom1, bom2]);

      const perfil = aggregated.get('Perfil aluminio|metro');
      expect(perfil).toBeDefined();
      expect(perfil?.quantidade).toBe(8);

      const vidro = aggregated.get('Vidro|m2');
      expect(vidro).toBeDefined();
      expect(vidro?.quantidade).toBe(2);
    });

    it('should return empty map for empty input', () => {
      const aggregated = BOMService.agregarMateriais([]);
      expect(aggregated.size).toBe(0);
    });

    it('should keep different materials separate', () => {
      const bom: BOMResult = {
        orcamento_item_id: '1',
        descricao: 'correr',
        largura: 1000,
        altura: 1000,
        quantidade: 1,
        materiais: [
          { nome: 'Trilho superior', categoria: 'aluminio', quantidade: 1, unidade: 'metro', formula: 'largura' },
          { nome: 'Roldana', categoria: 'ferragem', quantidade: 4, unidade: 'unidade', formula: '4' },
        ],
      };

      const aggregated = BOMService.agregarMateriais([bom]);
      expect(aggregated.size).toBe(2);
    });
  });
});
