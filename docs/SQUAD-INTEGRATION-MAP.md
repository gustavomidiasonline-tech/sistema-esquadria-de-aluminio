# 🔗 Squad Integration Map - Sistema ERP Alumínio

## Visão Geral

Documento que mapeia todos os fluxos de dados, webhooks e comunicação entre os 8 squads da arquitetura.

---

## 📊 Fluxo Principal: Pedido → Produção → Entrega

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORQUESTRADOR CENTRAL                        │
│              squad-aisistema-aliminio/orquestrador             │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (coordena tudo)

┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│   CRM       │    │  PRODUÇÃO    │    │   ESTOQUE    │
│ (pedido)    │───→│  (corte)     │───→│  (disponível)│
│             │    │              │    │              │
│squad-crm   │    │squad-producao│    │squad-estoque │
└─────────────┘    └──────────────┘    └──────────────┘
       ↓                   ↓                   ↓
  orçamento            relatório           alerta
       ↓                   ↓                   ↓
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│ FINANCEIRO  │    │  QUALIDADE   │    │  INTEGRAÇÕES │
│ (invoice)   │    │  (validação) │    │  (webhooks)  │
│             │    │              │    │              │
│squad-fin   │←───│squad-qualidad│←───│squad-integ  │
└─────────────┘    └──────────────┘    └──────────────┘
       ↓                   ↓                   ↓
  NF-e/DRE        aprovação QA      sincronização
       ↓                   ↓                   ↓
┌──────────────────────────────────────────────────────┐
│           DASHBOARD (real-time)                       │
│        squad-dashboard/dashboard-orchestrator        │
│   Visualiza tudo em tempo real para stakeholders     │
└──────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxos de Dados Detalhados

### FLUXO 1: Novo Pedido de Cliente (CRM → Squad-Producao)

```
1. INÍCIO
   └─ Cliente solicita orçamento
   └─ squad-crm recebe requisição

2. squad-crm/client-manager
   ├─ Buscar cliente existente ou criar novo
   ├─ Registrar especificações
   └─ Chamar squad-producao para validação tipologia

3. squad-producao/typology-manager
   ├─ Validar tipologia solicitada
   ├─ Retornar especificações técnicas
   └─ Webhook: POST /squad-crm/typology-validated

4. squad-crm/budget-generator
   ├─ Gerar orçamento com preço
   ├─ Incluir análise de viabilidade
   └─ Webhook: POST /squad-financeiro/new-quote-created

5. squad-financeiro/finance-controller
   ├─ Registrar potencial venda
   ├─ Calcular margem
   └─ Webhook: POST /squad-dashboard/new-opportunity

6. squad-dashboard
   └─ Exibir nova oportunidade em tempo real

STATUS: Orçamento enviado ao cliente
```

### FLUXO 2: Pedido Aprovado → Produção (CRM → Producao → Estoque)

```
1. INÍCIO
   └─ Cliente aprova orçamento
   └─ squad-crm recebe confirmação

2. squad-crm/client-manager
   ├─ Converter orçamento em pedido
   ├─ Confirmar dados de entrega
   └─ Webhook: POST /squad-producao/new-order

3. squad-producao/corte-optimizer
   ├─ Receber pedido com dimensões
   ├─ Consultar squad-estoque (disponibilidade)
   ├─ Gerar plano de corte otimizado
   └─ Webhook: POST /squad-qualidade/cutting-plan-ready

4. squad-qualidade/quality-checker
   ├─ Validar plano de corte
   ├─ Verificar conformidade técnica
   └─ Webhook: POST /squad-producao/plan-approved

5. squad-producao (se aprovado)
   ├─ Gerar relatório de produção
   └─ Webhook: POST /squad-estoque/reserve-material

6. squad-estoque/inventory-tracker
   ├─ Reservar material necessário
   ├─ Se insuficiente: alertar squad-estoque
   └─ Webhook: POST /squad-dashboard/material-reserved

7. squad-dashboard
   └─ Exibir status "Pronto para Produção"

STATUS: Produção pode começar
```

### FLUXO 3: Geração de NF-e (Producao → Financeiro → Integradores)

```
1. INÍCIO
   └─ Produção finalizada
   └─ squad-producao emite notificação

2. squad-producao/corte-optimizer
   ├─ Sinalizar produção completa
   └─ Webhook: POST /squad-financeiro/production-complete

3. squad-financeiro/nfe-processor
   ├─ Coletar dados de produção
   ├─ Gerar XML NF-e
   ├─ Validar conformidade fiscal
   └─ Webhook: POST /squad-integradores/nfe-ready

4. squad-integradores/integration-hub
   ├─ Receber NF-e
   ├─ Transformar dados
   ├─ Integrar com SEFAZ
   └─ Webhook: POST /squad-financeiro/nfe-transmitted

5. squad-financeiro/finance-controller
   ├─ Receber confirmação SEFAZ
   ├─ Gerar nota fiscal
   ├─ Atualizar fluxo de caixa
   └─ Webhook: POST /squad-crm/order-invoiced

6. squad-crm/client-manager
   ├─ Registrar faturamento
   ├─ Notificar cliente
   └─ Webhook: POST /squad-dashboard/invoice-sent

7. squad-dashboard
   └─ Exibir "Faturado" em tempo real

STATUS: Pedido faturado e registrado
```

### FLUXO 4: Controle de Qualidade (Qualidade → Dashboard)

```
1. INÍCIO
   └─ Produto entra em inspeção
   └─ squad-qualidade recebe amostra

2. squad-qualidade/quality-checker
   ├─ Executar checklists de QA
   ├─ Validar dimensões e acabamento
   ├─ Se PASSOU: continuar
   ├─ Se FALHOU: Webhook POST /squad-producao/quality-failed
   └─ Webhook: POST /squad-dashboard/qc-check-complete

3. squad-producao (se falhou)
   ├─ Receber notificação
   ├─ Registrar defeito
   └─ Webhook: POST /squad-qualidade/rework-required

4. squad-dashboard
   ├─ Exibir taxa de aceitação
   ├─ Exibir defeitos por tipo
   └─ Alertar se taxa < 98%

STATUS: Qualidade monitorada em tempo real
```

### FLUXO 5: Alertas de Reposição (Estoque → Compras)

```
1. INÍCIO
   └─ Material saindo em produção
   └─ squad-estoque monitora em tempo real

2. squad-estoque/inventory-tracker
   ├─ Atualizar movimento de saída
   ├─ Calcular dias de estoque
   ├─ Se dias < mínimo: ALERTA
   └─ Webhook: POST /squad-estoque/reorder-needed

3. squad-estoque/catalog-manager
   ├─ Buscar fornecedores do material
   ├─ Gerar requisição de compra
   └─ Webhook: POST /compras/purchase-request

4. squad-dashboard
   ├─ Exibir material em risco
   ├─ Exibir dias de estoque por material
   └─ Alert visual em vermelho se crítico

STATUS: Reposição automática acionada
```

---

## 🔌 Webhooks Definidos

| De | Para | Evento | Payload |
|----|----|--------|---------|
| squad-crm | squad-producao | `tipology-validation-request` | `{cliente_id, dimensões, material}` |
| squad-producao | squad-crm | `typology-validated` | `{tipologia_id, status, spec}` |
| squad-crm | squad-producao | `new-order` | `{order_id, pedido_data}` |
| squad-producao | squad-qualidade | `cutting-plan-ready` | `{plano_id, versão}` |
| squad-qualidade | squad-producao | `plan-approved` | `{plano_id, status}` |
| squad-producao | squad-estoque | `reserve-material` | `{material_list, quantidade}` |
| squad-estoque | squad-dashboard | `material-reserved` | `{material_id, qtd, data}` |
| squad-producao | squad-financeiro | `production-complete` | `{order_id, data_conclusao}` |
| squad-financeiro | squad-integradores | `nfe-ready` | `{nfe_xml, dados}` |
| squad-integradores | squad-financeiro | `nfe-transmitted` | `{nfe_id, status_sefaz}` |
| squad-estoque | squad-estoque | `reorder-needed` | `{material_id, qtd_necessaria}` |
| Qualquer | squad-dashboard | `status-update` | `{squad_id, status, timestamp}` |

---

## 📋 Ordem de Execução (Workflow)

### Cenário: Pedido Completo (Início ao Fim)

```
Semana 1:
  Mon: Cliente → Pedido entra (09:00)
       squad-crm valida (09:05)
       squad-crm gera orçamento (09:15)
       squad-financeiro registra (09:20)

  Tue: Cliente aprova (10:00)
       squad-producao cria plano (10:15)
       squad-qualidade valida (10:30)
       squad-estoque reserva material (10:45)

Semana 2:
  Mon: Produção inicia (08:00)
       squad-producao/corte-optimizer executa (durante dia)
       squad-qualidade monitora (em paralelo)
       squad-estoque rastreia consumo (real-time)

  Tue: Produção conclui (16:00)
       squad-financeiro gera NF-e (16:15)
       squad-integradores integra SEFAZ (16:30)
       squad-crm notifica cliente (16:45)
       squad-dashboard exibe "Concluído"
```

---

## 🎯 Responsabilidades por Squad

### Squad-CRM
- ✓ Gerenciar ciclo de vida do cliente
- ✓ Gerar e monitorar orçamentos
- ✓ Rastrear vendas e conversão
- ✓ Notificar cliente (email, sms)

### Squad-Producao
- ✓ Otimizar corte de material
- ✓ Validar tipologias
- ✓ Gerar plano de produção
- ✓ Sinalizar conclusão

### Squad-Estoque
- ✓ Rastrear inventário
- ✓ Alertar reposição
- ✓ Gerenciar catálogo
- ✓ Reservar material

### Squad-Financeiro
- ✓ Controlar cash flow
- ✓ Gerar NF-e
- ✓ Emitir relatórios (DRE, fluxo)
- ✓ Análise de lucratividade

### Squad-Dashboard
- ✓ Exibir todos os dados em tempo real
- ✓ Gerar alertas críticos
- ✓ Fornecer KPIs
- ✓ Monitorar saúde do sistema

### Squad-Qualidade
- ✓ Validar planos
- ✓ Executar checklists
- ✓ Auditar processos
- ✓ Sinalizar problemas

### Squad-Integradores
- ✓ Sincronizar com SEFAZ
- ✓ Integrar APIs externas
- ✓ Transformar dados
- ✓ Manter webhooks

### Orquestrador (squad-aisistema-aliminio)
- ✓ Coordenar fluxos
- ✓ Rotear mensagens
- ✓ Resolver conflitos
- ✓ Manter SLA

---

## 🚨 Tratamento de Erros

### Erro: Material Insuficiente

```
squad-estoque/inventory-tracker
  └─ Material insuficiente detectado
  └─ Webhook: POST /squad-producao/material-unavailable

squad-producao/corte-optimizer
  └─ Receber alerta
  └─ Status plano: "pendente_validacao"
  └─ Webhook: POST /squad-crm/order-on-hold

squad-crm/client-manager
  └─ Notificar cliente
  └─ Opções: aguardar / usar substituto / dividir pedido

Resolução:
  squad-estoque recebe reposição
  └─ Webhook: POST /squad-producao/material-available
  └─ squad-producao retoma execução
```

### Erro: Validação QA Falhou

```
squad-qualidade/quality-checker
  └─ Plano rejeitado
  └─ Webhook: POST /squad-producao/plan-rejected

squad-producao/corte-optimizer
  └─ Receber feedback
  └─ Gerar versão 2 do plano (otimização)
  └─ Webhook: POST /squad-qualidade/cutting-plan-v2-ready

squad-qualidade (retry)
  └─ Validar v2
  └─ Se PASSOU: Webhook POST /squad-producao/plan-approved
  └─ Se FALHOU: Escalate para orquestrador
```

---

## 🔐 SLAs de Resposta

| Operação | Tempo Máximo |
|----------|-------------|
| Orçamento | 15 min |
| Plano de corte | 5 min |
| Validação QA | 10 min |
| Reserva de material | 2 min |
| Geração NF-e | 30 min |
| Sincronização SEFAZ | 60 min |
| Dashboard update | 5 seg (real-time) |

---

## 📊 Exemplo: Pedido Real

### Input
```json
{
  "cliente_id": "CLI-001",
  "cliente_nome": "Vidraçaria Centro",
  "pedido": {
    "tipo": "porta_correr_2folhas",
    "dimensoes": {"altura": 2100, "largura": 1500},
    "material": "aluminio_6063",
    "vidro": "temperado_6mm",
    "quantidade": 10,
    "prazo_entrega": "2024-03-25"
  }
}
```

### Fluxo Automático (15 minutos)

```
09:00 - CRM recebe pedido
        └─ Valida cliente (1 seg)
        └─ Busca histórico (1 seg)

09:01 - Chamar squad-producao/typology-manager
        └─ Validar tipologia (2 seg)
        └─ Retornar specs (1 seg)

09:02 - squad-crm/budget-generator
        └─ Calcular preço (2 seg)
        └─ Gerar orçamento (1 seg)

09:03 - squad-financeiro/finance-controller
        └─ Registrar venda potencial (1 seg)
        └─ Calcular margem (1 seg)

09:04 - squad-dashboard atualiza
        └─ "Novo orçamento: Vidraçaria Centro - R$ 15.000"

09:05 - [Aguardando aprovação cliente...]

09:15 - Cliente aprova (simular)
        └─ squad-crm converte para pedido

09:16 - squad-producao/corte-optimizer
        └─ Consultar estoque (1 seg)
        └─ Gerar plano (3 seg)
        └─ Calcular eficiência: 88%

09:19 - squad-qualidade/quality-checker
        └─ Validar plano (5 seg)
        └─ Status: ✓ APROVADO

09:24 - squad-estoque/inventory-tracker
        └─ Reservar 10 unidades (2 seg)
        └─ Registrar reserva

09:25 - RESULTADO
        └─ Status: "Pronto para Produção"
        └─ Tempo total: 25 minutos
        └─ Dashboard exibe: Pedido confirmado, material reservado
```

---

## 📈 Métricas de Sucesso

Por squad:

| Squad | Métrica | Target |
|-------|---------|--------|
| CRM | Tempo orçamento | < 15 min |
| Producao | Tempo plano | < 5 min |
| Estoque | Acurácia inventário | 99.9% |
| Financeiro | Tempo NF-e | < 30 min |
| Dashboard | Latência dados | < 5 seg |
| Qualidade | Taxa rejeição | < 2% |
| Integradores | Taxa sincronização | 99.9% |

---

## 🚀 Deploy & Monitoramento

### Checklist Pré-Produção

- [ ] Todos os webhooks testados
- [ ] Integração SEFAZ validada
- [ ] Dashboard em tempo real funcionando
- [ ] Alertas configurados
- [ ] Logs centralizados
- [ ] Backups automáticos
- [ ] Fallbacks de erro testados

### Monitoramento Contínuo

```bash
# Verificar saúde dos squads
curl http://dashboard:3000/api/health

# Listar webhooks pendentes
curl http://orquestrador:4000/webhooks/pending

# Ver latência de integração
curl http://orquestrador:4000/metrics/latency
```

---

## 🎓 Próximos Passos

1. ✅ Arquitetura definida
2. ✅ Agentes e tasks criados
3. → **Implementar webhooks**
4. → Testes de integração
5. → Deploy staging
6. → Deploy produção
7. → Monitoramento 24/7

---

*Documento: Squad Integration Map v1.0 — Sistema ERP Completo*
*Última atualização: 2024-03-17*
