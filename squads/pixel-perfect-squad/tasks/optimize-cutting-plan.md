---
id: optimize-cutting-plan
agent: esquadria-engineer
elicit: false
---

# Task: Otimizar Algoritmo de Plano de Corte

## Objetivo
Melhorar o algoritmo FFD (First Fit Decreasing) atual em `src/services/cutting.service.ts`
para Best Fit Decreasing (BFD), reduzindo desperdício de material em ~15-20%.

## Contexto
O algoritmo atual usa FFD: encaixa cada peça na primeira barra que couber.
BFD melhora isso: encaixa na barra que sobra MENOS espaço após o corte,
minimizando o desperdício total.

## Análise do Algoritmo Atual

```typescript
// Auditar src/services/cutting.service.ts
// Identificar:
// 1. Estrutura de dados usada (barras, peças, rejeito)
// 2. Tamanho padrão de barras (geralmente 6000mm para alumínio)
// 3. Como o kerf (espessura de corte) é considerado
// 4. Como o resultado é retornado
```

## Passos

### PASSO 1 — Auditar Código Atual
Ler `src/services/cutting.service.ts` e documentar:
- Assinatura das funções
- Estrutura de dados de input/output
- Onde FFD é implementado

### PASSO 2 — Implementar BFD
```typescript
// Algoritmo Best Fit Decreasing
function bestFitDecreasing(
  pieces: number[],        // tamanhos das peças em mm
  barLength: number,       // comprimento da barra (padrão: 6000)
  kerf: number = 3,        // espessura do corte em mm
): CuttingPlanResult {
  // 1. Ordenar peças por tamanho (decrescente)
  const sorted = [...pieces].sort((a, b) => b - a);

  const bars: BarUsage[] = [];

  for (const piece of sorted) {
    let bestBarIndex = -1;
    let bestRemainingSpace = Infinity;

    // Encontrar a barra com MENOR espaço restante após encaixar esta peça
    for (let i = 0; i < bars.length; i++) {
      const remaining = bars[i].remainingSpace - piece - kerf;
      if (remaining >= 0 && remaining < bestRemainingSpace) {
        bestRemainingSpace = remaining;
        bestBarIndex = i;
      }
    }

    if (bestBarIndex === -1) {
      // Nenhuma barra disponível — abrir nova
      bars.push({
        id: bars.length + 1,
        length: barLength,
        pieces: [piece],
        remainingSpace: barLength - piece - kerf,
        waste: 0,
      });
    } else {
      bars[bestBarIndex].pieces.push(piece);
      bars[bestBarIndex].remainingSpace -= piece + kerf;
    }
  }

  // Calcular rejeito de cada barra
  bars.forEach(bar => {
    bar.waste = bar.remainingSpace;
  });

  return {
    bars,
    totalBars: bars.length,
    totalWaste: bars.reduce((acc, b) => acc + b.waste, 0),
    efficiency: calculateEfficiency(bars, barLength),
  };
}
```

### PASSO 3 — Adicionar Suporte a Múltiplos Comprimentos de Barra
```typescript
// Vidraçarias usam barras de 6m, 5m ou 3m
// Sistema deve escolher comprimento ótimo por perfil
interface BarConfig {
  profileId: string;
  availableLengths: number[];  // [6000, 5000, 3000]
  cost_per_meter: number;
}
```

### PASSO 4 — Testes Obrigatórios
```typescript
// src/test/services/cutting.service.test.ts
describe('CuttingService — BFD', () => {
  it('deve usar menos barras que FFD em média', () => {
    const pieces = [2300, 2100, 1800, 1600, 1400, 1200, 900, 700];
    const bfd = bestFitDecreasing(pieces, 6000);
    const ffd = firstFitDecreasing(pieces, 6000);
    expect(bfd.totalWaste).toBeLessThanOrEqual(ffd.totalWaste);
  });

  it('deve respeitar kerf na soma total', () => {
    const pieces = [1000, 1000, 1000];
    const result = bestFitDecreasing(pieces, 6000, kerf = 3);
    // 1000 + 3 + 1000 + 3 + 1000 = 3006 em uma barra
    expect(result.bars[0].pieces).toHaveLength(3);
  });

  it('deve lidar com peça maior que a barra', () => {
    const pieces = [7000]; // maior que 6000
    expect(() => bestFitDecreasing(pieces, 6000)).toThrow();
  });
});
```

### PASSO 5 — Salvar Detalhamento em cutting_plan_items
Após migration da tabela `cutting_plan_items`, persistir cada item:
```typescript
interface CuttingPlanItem {
  plano_id: string;
  bar_number: number;
  piece_length: number;
  piece_label: string;   // ex: "Folha Vertical - Janela #3"
  position_mm: number;   // posição inicial na barra
  kerf_after: boolean;
}
```

## Validação

- [ ] `npm test src/test/services/cutting.service.test.ts` passa
- [ ] Eficiência BFD >= eficiência FFD em casos de teste
- [ ] Output compatível com componente `PlanoDeCorte.tsx` (sem regressão visual)
- [ ] Kerf sempre considerado nos cálculos
