---
id: add-unit-tests
agent: domain-dev
elicit: true
---

# Task: Adicionar Testes Unitários

## Objetivo
Criar cobertura de testes unitários para services e utilitários do sistema,
usando Vitest conforme configurado em `vitest.config.ts`.

## Inputs (elicit)

1. **Qual service ou módulo testar?** (ex: orcamento.service, cutting.service, calculo-esquadria)
2. **Nível de cobertura alvo?** (padrão: 80% das funções públicas)

## Estrutura de Testes

```
src/test/
├── services/
│   ├── orcamento.service.test.ts
│   ├── cutting.service.test.ts
│   ├── esquadria.service.test.ts
│   ├── pricing.service.test.ts
│   └── production.service.test.ts
├── repositories/          (testes de integração — opcional)
│   └── orcamentos.repository.test.ts
└── lib/
    └── calculo-esquadria.test.ts
```

## Padrão de Teste por Service

### Template Base
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { {NomeService} } from '@/services/{nome}.service';

describe('{NomeService}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('{nomeMetodo}', () => {
    it('deve {comportamento esperado} quando {condição}', () => {
      // Arrange
      const input = { /* dados de teste */ };

      // Act
      const result = {NomeService}.{nomeMetodo}(input);

      // Assert
      expect(result).toEqual({ /* resultado esperado */ });
    });

    it('deve lançar erro quando {condição inválida}', () => {
      expect(() => {NomeService}.{nomeMetodo}(null)).toThrow();
    });
  });
});
```

## Prioridade de Cobertura

### 1. calculo-esquadria.ts (CRÍTICO — lógica financeira)
- `calcularPerfis()` — cada modelo com diferentes dimensões
- `calcularVidros()` — por tipo (temperado, laminado, insulado)
- `calcularFerragens()` — por modelo
- Casos de borda: dimensões mínimas, máximas, zero

### 2. cutting.service.ts (CRÍTICO — impacta custo de material)
- BFD com diferentes conjuntos de peças
- Kerf calculation
- Múltiplos comprimentos de barra
- Peça maior que a barra (deve lançar erro)

### 3. pricing.service.ts (IMPORTANTE — impacta faturamento)
- Cálculo de margem
- Aplicação de desconto
- Preço por m² (vidro)
- Arredondamento

### 4. orcamento.service.ts (IMPORTANTE)
- Cálculo de totais
- Aplicação de desconto por item vs total

## Como Executar

```bash
# Rodar todos os testes
npm test

# Rodar testes de um service específico
npm test src/test/services/cutting.service.test.ts

# Rodar com coverage
npm run test:coverage

# Watch mode durante desenvolvimento
npm run test:watch
```

## Critérios de Conclusão

- [ ] Todos os testes passam (`npm test` verde)
- [ ] Cobertura das funções alvo >= 80%
- [ ] Nenhum `any` nos arquivos de teste
- [ ] Casos felizes + casos de erro cobertos
- [ ] Testes são independentes (sem dependência entre si)
