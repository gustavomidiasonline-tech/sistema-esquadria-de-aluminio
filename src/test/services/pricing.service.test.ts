import { describe, it, expect } from 'vitest';
import { PricingService } from '@/services/pricing.service';
import type { ConfigPrecos, MaterialParaCalculo } from '@/services/pricing.service';

const configPadrao: ConfigPrecos = {
  preco_kg_aluminio: 35.0,
  preco_m2_vidro: 80.0,
  preco_hora_mao_obra: 60.0,
  frete_percentual: 5.0,
  impostos_percentual: 10.0,
};

const materiais: MaterialParaCalculo[] = [
  { tipo: 'aluminio', descricao: 'Perfis', quantidade: 5, unidade: 'kg' },
  { tipo: 'vidro', descricao: 'Vidro', quantidade: 1.2, unidade: 'm2' },
  { tipo: 'mao_obra', descricao: 'Mão de obra', quantidade: 2, unidade: 'h' },
];

describe('PricingService', () => {
  describe('calcularCusto', () => {
    it('deve calcular custo com todos os materiais', () => {
      const custo = PricingService.calcularCusto(materiais, configPadrao);

      expect(custo.custoMateriais).toBeGreaterThan(0);
      expect(custo.custoMaoObra).toBeGreaterThan(0);
      expect(custo.custoTotal).toBeGreaterThan(0);
    });

    it('deve calcular alumínio corretamente', () => {
      // 5 kg * R$35 = R$175
      const custo = PricingService.calcularCusto(
        [{ tipo: 'aluminio', descricao: 'Perfis', quantidade: 5, unidade: 'kg' }],
        { ...configPadrao, frete_percentual: 0, impostos_percentual: 0 }
      );

      expect(custo.custoMateriais).toBe(175);
    });

    it('deve calcular vidro corretamente', () => {
      // 1.2 m2 * R$80 = R$96
      const custo = PricingService.calcularCusto(
        [{ tipo: 'vidro', descricao: 'Vidro', quantidade: 1.2, unidade: 'm2' }],
        { ...configPadrao, frete_percentual: 0, impostos_percentual: 0 }
      );

      expect(custo.custoMateriais).toBe(96);
    });

    it('deve incluir frete no custo total', () => {
      const custo = PricingService.calcularCusto(
        [{ tipo: 'aluminio', descricao: 'Perfis', quantidade: 1, unidade: 'kg', precoUnitario: 100 }],
        { ...configPadrao, frete_percentual: 10, impostos_percentual: 0 }
      );

      // custo base = 100, frete 10% = 10, total = 110
      expect(custo.custoFrete).toBe(10);
    });

    it('deve usar preço unitário customizado quando fornecido', () => {
      const custo = PricingService.calcularCusto(
        [{ tipo: 'aluminio', descricao: 'Teste', quantidade: 2, unidade: 'kg', precoUnitario: 50 }],
        { ...configPadrao, frete_percentual: 0, impostos_percentual: 0 }
      );

      expect(custo.custoMateriais).toBe(100); // 2 * 50
    });
  });

  describe('aplicarMargem', () => {
    it('deve calcular preço com margem de 30%', () => {
      // custo 100, margem 30% → preço = 100 / 0.7 ≈ 142.86
      const preco = PricingService.aplicarMargem(100, 30);
      expect(preco).toBeCloseTo(142.86, 1);
    });

    it('deve retornar custo original com margem zero', () => {
      const preco = PricingService.aplicarMargem(100, 0);
      expect(preco).toBe(100);
    });

    it('deve retornar custo com margem negativa', () => {
      const preco = PricingService.aplicarMargem(100, -10);
      expect(preco).toBe(100); // margem <= 0 retorna custo
    });
  });

  describe('calcularLucro', () => {
    it('deve calcular valor e percentual de lucro', () => {
      const lucro = PricingService.calcularLucro(150, 100);

      expect(lucro.valor).toBe(50);
      expect(lucro.percentual).toBeCloseTo(33.33, 1);
    });
  });

  describe('calcularPrecoFinal', () => {
    it('deve arredondar para múltiplo de 0.50', () => {
      const custo = PricingService.calcularCusto(
        [{ tipo: 'aluminio', descricao: 'Teste', quantidade: 1, unidade: 'kg', precoUnitario: 100 }],
        { ...configPadrao, frete_percentual: 0, impostos_percentual: 0 }
      );

      const preco = PricingService.calcularPrecoFinal(custo, 30, true);
      expect(preco % 0.5).toBe(0); // deve ser múltiplo de 0.50
    });
  });
});
