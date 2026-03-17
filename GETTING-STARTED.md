# 🚀 Getting Started - Guia Prático de Implementação

**Tempo Estimado:** 2-4 semanas para produção
**Dificuldade:** Média
**Pré-requisitos:** Node.js 18+, Docker, Git

---

## 📋 Checklist Pré-Implementação

- [ ] Ler SQUADS-README.md (5 min)
- [ ] Ler SQUAD-INTEGRATION-MAP.md (10 min)
- [ ] Ler WEBHOOK-PAYLOADS.md (10 min)
- [ ] Entender fluxo de um pedido completo
- [ ] Mapear technology stack (Node.js, Python, Go)
- [ ] Configurar ambiente local
- [ ] Criar repositórios para cada squad (opcional)

---

## 🎯 Fase 1: Setup de Ambiente (2-3 horas)

### 1.1 Clonar Estrutura Base

```bash
cd squads/

# Verifica estrutura
ls -la

# Esperado:
# squad-aisistema-aliminio/  (Orquestrador)
# squad-crm/
# squad-dashboard/
# squad-estoque/
# squad-financeiro/
# squad-integradores/
# squad-producao/
# squad-qualidade/
```

### 1.2 Criar Docker Compose

```dockerfile
# docker-compose.yml (raiz do projeto)

version: '3.8'

services:
  squad-producao:
    build: ./squads/squad-producao
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=development
      - SERVICE_NAME=squad-producao

  squad-estoque:
    build: ./squads/squad-estoque
    ports:
      - "3003:3000"
    environment:
      - NODE_ENV=development
      - SERVICE_NAME=squad-estoque

  squad-crm:
    build: ./squads/squad-crm
    ports:
      - "3004:3000"
    environment:
      - NODE_ENV=development

  squad-financeiro:
    build: ./squads/squad-financeiro
    ports:
      - "3005:3000"
    environment:
      - NODE_ENV=development

  squad-dashboard:
    build: ./squads/squad-dashboard
    ports:
      - "3006:3000"
    environment:
      - NODE_ENV=development

  squad-qualidade:
    build: ./squads/squad-qualidade
    ports:
      - "3007:3000"
    environment:
      - NODE_ENV=development

  squad-integradores:
    build: ./squads/squad-integradores
    ports:
      - "3008:3000"
    environment:
      - NODE_ENV=development

  orquestrador:
    build: ./squads/squad-aisistema-aliminio
    ports:
      - "4000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
    depends_on:
      - squad-producao
      - squad-estoque
      - squad-crm
      - squad-financeiro
      - squad-dashboard
      - squad-qualidade
      - squad-integradores
```

### 1.3 Setup CI/CD

```yaml
# .github/workflows/squad-ci.yml

name: Squad CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Test Squad-Producao
        run: |
          cd squads/squad-producao
          npm install
          npm test

      - name: Lint Squad-Producao
        run: |
          cd squads/squad-producao
          npm run lint
```

---

## 🔧 Fase 2: Implementar Squad-Producao (3-4 dias)

**Recomendação:** Começar por este squad porque:
- É o core da produção
- Tem algoritmos bem definidos (Bin Packing)
- Não depende de outros squads

### 2.1 Estrutura do Projeto

```
squads/squad-producao/
├── src/
│   ├── agents/
│   │   ├── corte-optimizer.ts
│   │   └── typology-manager.ts
│   ├── services/
│   │   ├── cutting-optimizer.ts (implementa Bin Packing)
│   │   └── typology-validator.ts
│   ├── routes/
│   │   ├── typology.ts
│   │   ├── cutting-plan.ts
│   │   └── health.ts
│   ├── models/
│   │   ├── cuttingPlan.ts
│   │   └── typology.ts
│   └── app.ts (Express)
├── tests/
│   ├── cutting-optimizer.test.ts
│   ├── typology-validator.test.ts
│   └── integration.test.ts
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

### 2.2 Implementar Corte-Optimizer

```typescript
// src/agents/corte-optimizer.ts

export class CorteOptimizer {
  /**
   * Otimiza plano de corte usando Bin Packing Algorithm
   * (Maximal Rectangles ou Guillotine)
   */
  async optimize(pedidos: Pedido[]): Promise<PlanoCorte> {
    // 1. Validar entrada
    this.validarPedidos(pedidos);

    // 2. Consolidar pedidos (mesma tipologia/material)
    const lotes = this.consolidarPedidos(pedidos);

    // 3. Para cada lote, executar Bin Packing
    for (const lote of lotes) {
      const resultado = this.executarBinPacking(lote);

      // 4. Validar geométricamente
      this.validarGeometria(resultado);

      // 5. Calcular custos
      this.calcularCustos(resultado);

      // 6. Gerar recomendações
      this.gerarRecomendacoes(resultado);
    }

    return this.construirPlanoFinal();
  }

  // Bin Packing: Algoritmo Maximal Rectangles
  private executarBinPacking(lote: Lote): Arranjo {
    const material = lote.materialDisponivel;
    const pecas = lote.pecas;

    // Implementar algoritmo
    // Simplificado aqui, veja literatura para detalhes
    const arranjo = new Arranjo(material);

    for (const peca of pecas) {
      // Encontrar melhor posição para peca
      const melhorPosicao = arranjo.encontrarMelhorPosicao(peca);

      if (melhorPosicao) {
        arranjo.colocarPeca(peca, melhorPosicao);
      } else {
        throw new Error(`Nao couber peca: ${peca.id}`);
      }
    }

    return arranjo;
  }
}
```

### 2.3 Endpoint HTTP

```typescript
// src/routes/cutting-plan.ts

router.post('/create-cutting-plan', async (req, res) => {
  try {
    const optimizer = new CorteOptimizer();
    const planoCorte = await optimizer.optimize(req.body.pedidos);

    // Retornar plano
    res.json({
      status: 'sucesso',
      plano: planoCorte
    });

    // Disparar webhook para squad-qualidade
    await webhookClient.post(
      'http://squad-qualidade:3007/validate-cutting-plan',
      planoCorte
    );

  } catch (error) {
    res.status(400).json({
      status: 'erro',
      mensagem: error.message
    });
  }
});
```

### 2.4 Testes Unitários

```typescript
// tests/cutting-optimizer.test.ts

describe('CorteOptimizer', () => {
  let optimizer: CorteOptimizer;

  beforeEach(() => {
    optimizer = new CorteOptimizer();
  });

  it('deve otimizar pedido simples com eficiência ≥85%', async () => {
    const pedido = {
      tipo: 'porta-correr',
      dimensoes: { altura: 2100, largura: 1500 },
      quantidade: 10
    };

    const resultado = await optimizer.optimize([pedido]);

    expect(resultado.eficiencia).toBeGreaterThanOrEqual(85);
  });

  it('deve gerar coordenadas sem overlaps', async () => {
    const resultado = await optimizer.optimize([...]);

    // Validar não há overlaps
    for (let i = 0; i < resultado.pecas.length; i++) {
      for (let j = i + 1; j < resultado.pecas.length; j++) {
        expect(
          hasOverlap(resultado.pecas[i], resultado.pecas[j])
        ).toBeFalsy();
      }
    }
  });

  it('deve alertar se material insuficiente', async () => {
    const pedidoGrande = {
      tipo: 'porta-correr',
      quantidade: 100  // Muito material
    };

    expect(() => {
      optimizer.optimize([pedidoGrande]);
    }).toThrow('MATERIAL_INSUFICIENTE');
  });
});
```

---

## 🔌 Fase 3: Integrar Webhooks (2-3 dias)

### 3.1 Configurar Orquestrador

```typescript
// squads/squad-aisistema-aliminio/src/orchestrator.ts

export class Orchestrator {
  async processarPedido(pedido: Pedido) {
    try {
      // 1. CRM valida tipologia
      const tipologiaValida = await this.chamarSquad(
        'squad-producao',
        '/validate-typology',
        { tipologia_id: pedido.tipologia }
      );

      if (!tipologiaValida.valid) {
        throw new Error('Tipologia inválida');
      }

      // 2. Producao cria plano de corte
      const planoCorte = await this.chamarSquad(
        'squad-producao',
        '/create-cutting-plan',
        { pedidos: [pedido] }
      );

      // 3. Qualidade valida
      const validacaoQA = await this.chamarSquad(
        'squad-qualidade',
        '/validate-cutting-plan',
        planoCorte
      );

      if (!validacaoQA.aprovado) {
        throw new Error('Plano rejeitado por QA');
      }

      // 4. Estoque reserva material
      await this.chamarSquad(
        'squad-estoque',
        '/reserve-material',
        { materiais: pedido.materiais_necessarios }
      );

      // 5. Dashboard atualiza
      await this.notificarDashboard({
        tipo: 'pedido_processado',
        pedido_id: pedido.id,
        status: 'pronto_producao'
      });

      return {
        status: 'sucesso',
        plano: planoCorte
      };

    } catch (error) {
      // Tratamento de erro
      await this.notificarErro(error);
      throw error;
    }
  }

  private async chamarSquad(squad: string, endpoint: string, payload: any) {
    const url = `http://${squad}:3000${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`${squad} error: ${response.statusText}`);
    }

    return response.json();
  }
}
```

### 3.2 Implementar Webhook Manager

```typescript
// src/services/webhook-manager.ts

export class WebhookManager {
  private queue: WebhookEvent[] = [];
  private retryConfig = {
    maxRetries: 3,
    retryDelayMs: 5000
  };

  async enqueue(event: WebhookEvent) {
    this.queue.push(event);
    await this.processQueue();
  }

  private async processQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();

      for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
        try {
          await fetch(event.destination, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': this.generateSignature(event)
            },
            body: JSON.stringify(event)
          });

          break; // Sucesso

        } catch (error) {
          if (attempt === this.retryConfig.maxRetries - 1) {
            // Falha permanente - registrar
            console.error(`Webhook failed: ${event.destination}`, error);

            // Armazenar para retry manual depois
            await this.storeFailedWebhook(event);
          }

          // Esperar antes de retry
          await this.delay(this.retryConfig.retryDelayMs);
        }
      }
    }
  }
}
```

---

## 📊 Fase 4: Testes E2E (2-3 dias)

### 4.1 Teste Completo: Pedido → Produção

```typescript
// tests/e2e/pedido-completo.test.ts

describe('Fluxo E2E: Novo Pedido', () => {
  it('deve processar pedido do início ao fim', async () => {
    // Setup
    const pedido = {
      id: 'PED-TEST-001',
      cliente_id: 'CLI-001',
      tipologia: 'porta-correr-premium',
      dimensoes: { altura: 2100, largura: 1500 },
      quantidade: 10
    };

    // 1. Enviar ao orquestrador
    const response = await fetch('http://localhost:4000/processar-pedido', {
      method: 'POST',
      body: JSON.stringify(pedido)
    });

    expect(response.status).toBe(200);
    const resultado = await response.json();
    expect(resultado.status).toBe('sucesso');

    // 2. Verificar que squad-qualidade recebeu webhook
    const qaLog = await fetch('http://localhost:3007/logs');
    const qaData = await qaLog.json();
    expect(qaData.ultimoWebhook.plano_id).toBe(resultado.plano.id);

    // 3. Verificar que material foi reservado
    const estoqueCheck = await fetch('http://localhost:3003/verificar-reserva?plano=...');
    const estoque = await estoqueCheck.json();
    expect(estoque.reservado).toBe(true);

    // 4. Verificar dashboard foi atualizado
    const dashboard = await fetch('http://localhost:3006/status');
    const dashData = await dashboard.json();
    expect(dashData.pedidos_em_andamento).toContain(pedido.id);
  });
});
```

---

## 🚀 Deploy (1-2 dias)

### 4.1 Deploy Staging

```bash
# Build
docker-compose -f docker-compose.staging.yml build

# Push para registry
docker tag squad-producao my-registry/squad-producao:latest
docker push my-registry/squad-producao:latest

# Deploy
docker-compose -f docker-compose.staging.yml up -d

# Smoke tests
curl http://localhost:3002/health
curl http://localhost:3003/health
# ... etc

# Testes E2E em staging
npm run test:e2e:staging
```

### 4.2 Deploy Produção

```bash
# Blue-Green deployment
docker pull my-registry/squad-producao:latest

# Update production compose
docker-compose -f docker-compose.prod.yml up -d

# Health check
for i in {1..5}; do
  curl http://localhost:3002/health
  sleep 10
done

# Se OK: remover versão anterior
docker image prune -a -f
```

---

## 📊 Monitoramento Pós-Deploy

### 4.1 Setup Logs Centralizados

```yaml
# docker-compose.yml (adicionar)

  elk:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

# Cada squad manda logs para ELK
# curl -X POST "http://elasticsearch:9200/logs/_doc" \
#   -H "Content-Type: application/json" \
#   -d '{"squad": "squad-producao", "mensagem": "..."}'
```

### 4.2 Setup Alertas

```yaml
# Prometheus/AlertManager config
groups:
  - name: squads
    rules:
      - alert: SquadDown
        expr: up{job="squad"} == 0
        for: 5m
        annotations:
          summary: "Squad {{ $labels.squad }} is down"

      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 5
        annotations:
          summary: "High latency detected"
```

---

## ✅ Checklist de Produção

- [ ] Todos os squads têm health checks
- [ ] Logs centralizados (ELK ou Datadog)
- [ ] Alertas configurados
- [ ] Backups automáticos ativados
- [ ] Documentação de runbooks
- [ ] Plano de escalabilidade
- [ ] Testes de failover executados
- [ ] Treinamento de equipes completo

---

## 🆘 Troubleshooting

### Squad não responde

```bash
# 1. Verificar logs
docker logs squad-producao

# 2. Verificar porta
netstat -tulpn | grep 3002

# 3. Reiniciar
docker restart squad-producao

# 4. Check health
curl http://localhost:3002/health
```

### Webhook não dispara

```bash
# 1. Verificar fila
curl http://orquestrador:4000/webhooks/pending

# 2. Ver histórico
curl http://orquestrador:4000/logs/webhooks?limit=20

# 3. Retry manual
curl -X POST http://orquestrador:4000/webhooks/retry/webhook-id
```

---

## 📞 Suporte & Documentação

- **README Principal:** `SQUADS-README.md`
- **Integração:** `docs/SQUAD-INTEGRATION-MAP.md`
- **Payloads:** `docs/WEBHOOK-PAYLOADS.md`
- **Resumo:** `IMPLEMENTATION-SUMMARY.txt`

---

## 🎯 Timeline Estimada

| Fase | Duração | Tarefas |
|------|---------|---------|
| Setup | 2-3h | Docker, CI/CD, git |
| Squad-Producao | 3-4d | Code + tests + integration |
| Webhooks | 2-3d | Orquestrador + managers |
| E2E Testing | 2-3d | Testes + bugfixes |
| Deploy | 1-2d | Staging + produção |
| Monitoramento | 1-2d | Logs + alertas + runbooks |
| **TOTAL** | **2-3 semanas** | **Pronto para produção** |

---

*Guia de Implementação v1.0*
*Estimado: 2-3 semanas até produção*
*Status: Ready to Execute*
