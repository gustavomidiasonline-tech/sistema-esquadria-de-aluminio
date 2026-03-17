# 🔌 Webhook Payloads - Comunicação Entre Squads

Exemplos práticos de payloads JSON para todos os webhooks do sistema.

---

## 1️⃣ CRM → Producao: Nova Validação de Tipologia

### Request
```bash
POST /squad-producao/validate-typology
Content-Type: application/json
X-Idempotency-Key: req-cli-001-2024-03-17-001
```

```json
{
  "requisicao_id": "REQ-CLI-001-2024-03-17",
  "origem": "squad-crm",
  "timestamp": "2024-03-17T09:00:00Z",

  "cliente": {
    "id": "CLI-001",
    "nome": "Vidraçaria Centro",
    "tipo": "comercial"
  },

  "tipologia_validacao": {
    "tipologia_id": "porta-correr-premium",
    "dimensoes": {
      "altura": 2100,
      "largura": 1500,
      "profundidade": 90
    },
    "especificacoes": {
      "material": "aluminio_6063",
      "vidro_type": "temperado",
      "vidro_espessura": 6,
      "acabamento": "anodizado_prata"
    },
    "ambiente": "externo",
    "orientacao": "norte",
    "criterios_especiais": {
      "isolamento_acustico_minimo": 35,
      "isolamento_termico_minimo": 1.8,
      "seguranca": "alta"
    }
  },

  "contexto": {
    "origem_pedido": "orcamento",
    "pedido_id": "PED-CLI-001-2024-03-17",
    "prazo_resposta": 600  // segundos
  }
}
```

### Response (200 OK)
```json
{
  "requisicao_id": "REQ-CLI-001-2024-03-17",
  "timestamp_resposta": "2024-03-17T09:02:15Z",

  "validacao": {
    "status": "valido_com_restricoes",
    "conformidade_percentual": 95,
    "avisos": [
      "Orientação norte: risco de condensação. Recomenda-se vidro low-e.",
      "Isolamento acústico (37dB) > requisitado (35dB): OK"
    ],
    "erros": []
  },

  "tipologia_data": {
    "id": "porta-correr-premium",
    "nome": "Porta Correr Premium 2 Folhas",
    "especificacoes": {
      "dimensoes": {
        "altura_min": 1800,
        "altura_max": 2400,
        "largura_min": 1500,
        "largura_max": 2000
      },
      "isolamento": {
        "termico": 1.9,
        "acustico": 37
      },
      "performance": {
        "resistencia_vento": "Classe C5",
        "hermeticidade": "Classe 3",
        "vida_util_anos": 25
      }
    }
  },

  "recomendacoes": [
    "Instalar vidro low-e para melhor isolamento térmico na orientação norte",
    "Considerar desumidificador automático"
  ],

  "alternativas": [
    {
      "id": "janela-dupla-termoacustica",
      "nome": "Janela Dupla Termoacústica",
      "isolamento_acustico": 40,
      "vantagem_preco": -300,
      "motivo": "Melhor isolamento acústico (40dB vs 37dB)"
    }
  ],

  "precificacao": {
    "preco_base": 4200,
    "customizacoes": {
      "vidro_low_e": 350,
      "total_customizacao": 350
    },
    "preco_final": 4550,
    "descontos_volume": [
      {
        "quantidade_minima": 20,
        "desconto_percentual": 5,
        "preco_com_desconto": 4322.50
      }
    ]
  }
}
```

---

## 2️⃣ CRM → Producao: Novo Pedido

### Request
```bash
POST /squad-producao/create-cutting-plan
Content-Type: application/json
X-Idempotency-Key: ped-cli-001-2024-03-17-001
```

```json
{
  "pedido_id": "PED-CLI-001-2024-03-17",
  "timestamp": "2024-03-17T10:00:00Z",

  "cliente": {
    "id": "CLI-001",
    "nome": "Vidraçaria Centro",
    "endereco_entrega": "Rua X, 123",
    "contato": "+55 11 98765-4321"
  },

  "pedido_items": [
    {
      "item_id": "ITEM-001",
      "tipologia": "porta-correr-premium",
      "dimensoes": {
        "altura": 2100,
        "largura": 1500
      },
      "material": "aluminio_6063",
      "vidro": "temperado_6mm",
      "acabamento": "anodizado_prata",
      "quantidade": 10
    }
  ],

  "materiais_necessarios": {
    "aluminio_6063": {
      "quantidade": 12,
      "unidade": "m²",
      "tamanho_padrao": {
        "altura": 6000,
        "largura": 400
      }
    },
    "vidro": {
      "quantidade": 10,
      "unidade": "unidades",
      "tipo": "temperado_6mm"
    }
  },

  "restricoes": {
    "corte_minimo": 20,
    "velocidade_corte": "media",
    "tolerancia": 2,
    "prioridade": "alta"
  },

  "cronograma": {
    "data_inicio": "2024-03-18",
    "data_limite_entrega": "2024-03-25",
    "dias_disponiveis": 5
  }
}
```

### Response (201 Created)
```json
{
  "pedido_id": "PED-CLI-001-2024-03-17",
  "plano_id": "PLAN-CLI-001-2024-03-17-V1",
  "timestamp_criacao": "2024-03-17T10:05:30Z",

  "status": "pronto_validacao_qa",

  "plano_corte": {
    "versao": 1,
    "eficiencia": 88,
    "desperdicio_m2": 1.44,
    "tempo_total_minutos": 45,

    "pecas": [
      {
        "id": "PEC-001",
        "tipo": "Perfil inferior",
        "dimensoes": {
          "altura": 2080,
          "largura": 1480
        },
        "quantidade": 10,
        "tempo_corte": 8,
        "coordenadas": {
          "x": 50,
          "y": 50,
          "rotacao": 0
        }
      }
    ],

    "material_utilizado": {
      "aluminio_6063": 11.2
    },

    "recomendacoes": [
      "Excelente aproveitamento (88%)",
      "Tempo dentro do previsto (45 min)",
      "Material suficiente em estoque"
    ]
  },

  "reservas": {
    "material_reservado": [
      {
        "material": "aluminio_6063",
        "quantidade": 11.2,
        "unidade": "m²",
        "status": "reservado"
      }
    ]
  },

  "webhook_destino": "/squad-qualidade/validate-cutting-plan"
}
```

---

## 3️⃣ Producao → Qualidade: Plano de Corte Pronto

### Request
```bash
POST /squad-qualidade/validate-cutting-plan
Content-Type: application/json
```

```json
{
  "validacao_id": "VAL-PLAN-CLI-001-2024-03-17",
  "plano_id": "PLAN-CLI-001-2024-03-17-V1",
  "timestamp": "2024-03-17T10:05:30Z",

  "plano_corte": {
    "versao": 1,
    "eficiencia": 88,
    "tempo_minutos": 45,
    "pecas_totais": 10,
    "material_utilizado": 11.2
  },

  "validacoes_requeridas": [
    "conformidade_dimensional",
    "compatibilidade_tipologia",
    "disponibilidade_material",
    "viabilidade_temporal"
  ],

  "prioridade": "alta"
}
```

### Response (200 OK)
```json
{
  "validacao_id": "VAL-PLAN-CLI-001-2024-03-17",
  "plano_id": "PLAN-CLI-001-2024-03-17-V1",
  "timestamp_validacao": "2024-03-17T10:10:45Z",

  "resultado": "aprovado",
  "conformidade": 99,

  "validacoes": [
    {
      "check": "conformidade_dimensional",
      "resultado": "passou",
      "detalhes": "Todas as peças dentro de ±2mm"
    },
    {
      "check": "compatibilidade_tipologia",
      "resultado": "passou",
      "detalhes": "Tipologia porta-correr-premium validada"
    },
    {
      "check": "disponibilidade_material",
      "resultado": "passou",
      "detalhes": "Alumínio 6063: 12m² disponível"
    },
    {
      "check": "viabilidade_temporal",
      "resultado": "passou",
      "detalhes": "45 min de corte, prazo 5 dias = OK"
    }
  ],

  "avisos": [],

  "webhook_destino": "/squad-producao/plan-approved-for-execution"
}
```

---

## 4️⃣ Producao → Estoque: Reservar Material

### Request
```bash
POST /squad-estoque/reserve-material
Content-Type: application/json
```

```json
{
  "reserva_id": "RES-PLAN-CLI-001-2024-03-17",
  "pedido_id": "PED-CLI-001-2024-03-17",
  "timestamp": "2024-03-17T10:11:00Z",

  "materiais_para_reservar": [
    {
      "material_id": "MAT-ALU-6063",
      "material_nome": "Alumínio 6063",
      "quantidade": 11.2,
      "unidade": "m²",
      "prioridade": "alta",
      "data_necessaria": "2024-03-18"
    },
    {
      "material_id": "MAT-VID-TEMP",
      "material_nome": "Vidro Temperado 6mm",
      "quantidade": 10,
      "unidade": "unidades",
      "prioridade": "alta",
      "data_necessaria": "2024-03-18"
    }
  ],

  "contexto": {
    "origem": "squad-producao",
    "motivo": "Plano de corte aprovado"
  }
}
```

### Response (200 OK)
```json
{
  "reserva_id": "RES-PLAN-CLI-001-2024-03-17",
  "timestamp_confirmacao": "2024-03-17T10:11:30Z",

  "status": "reservado",

  "materiais_reservados": [
    {
      "material_id": "MAT-ALU-6063",
      "quantidade_reservada": 11.2,
      "quantidade_disponivel": 0.8,
      "status": "reservado",
      "data_necessaria": "2024-03-18",
      "lotes": ["LOTE-ALU-2024-001"]
    },
    {
      "material_id": "MAT-VID-TEMP",
      "quantidade_reservada": 10,
      "quantidade_disponivel": -2,
      "status": "parcial_com_alerta",
      "alerta": "Insuficiente. 2 unidades serão adquiridas.",
      "prazo_chegada_reposicao": "2024-03-18"
    }
  ],

  "resumo": {
    "total_reservado": 2,
    "sem_problema": 1,
    "com_alerta": 1,
    "nao_disponivel": 0
  },

  "proxima_acao": "Produção pode iniciar conforme planejado",
  "webhook_destino": "/squad-dashboard/material-reserved"
}
```

---

## 5️⃣ Producao → Financeiro: Produção Concluída

### Request
```bash
POST /squad-financeiro/production-complete
Content-Type: application/json
```

```json
{
  "notificacao_id": "NOT-PROD-COMPLETE-CLI-001-2024-03-19",
  "pedido_id": "PED-CLI-001-2024-03-17",
  "timestamp": "2024-03-19T16:00:00Z",

  "producao": {
    "plano_id": "PLAN-CLI-001-2024-03-17-V1",
    "quantidade_produzida": 10,
    "quantidade_esperada": 10,
    "taxa_sucesso": 100,
    "data_inicio": "2024-03-18",
    "data_conclusao": "2024-03-19",
    "tempo_producao_minutos": 45,
    "material_utilizado": {
      "aluminio_6063": 11.2,
      "vidro": 10
    }
  },

  "controle_qualidade": {
    "inspecoes_realizadas": 10,
    "aprovadas": 10,
    "rejeitadas": 0,
    "taxa_aceitacao": 100
  },

  "dados_para_faturamento": {
    "quantidade": 10,
    "valor_unitario": 455,
    "valor_total": 4550,
    "impostos_estimados": 1092
  }
}
```

### Response (200 OK)
```json
{
  "notificacao_id": "NOT-PROD-COMPLETE-CLI-001-2024-03-19",
  "pedido_id": "PED-CLI-001-2024-03-17",
  "timestamp_recebimento": "2024-03-19T16:00:30Z",

  "status": "recebido_para_processamento",

  "proximas_acoes": [
    {
      "acao": "Gerar Nota Fiscal",
      "executor": "squad-financeiro/nfe-processor",
      "prazo": "30 minutos"
    },
    {
      "acao": "Transmitir NF-e ao SEFAZ",
      "executor": "squad-integradores/integration-hub",
      "prazo": "60 minutos"
    },
    {
      "acao": "Notificar Cliente",
      "executor": "squad-crm/client-manager",
      "prazo": "imediato"
    }
  ],

  "webhook_destino": [
    "/squad-financeiro/generate-invoice",
    "/squad-integradores/process-nfe"
  ]
}
```

---

## 6️⃣ Estoque → Dashboard: Material Reservado

### Request (Webhook automático)
```bash
POST /squad-dashboard/material-reserved
Content-Type: application/json
```

```json
{
  "evento_id": "EVT-MAT-RES-CLI-001-2024-03-17",
  "tipo_evento": "material_reserved",
  "timestamp": "2024-03-17T10:11:30Z",
  "squad_origem": "squad-estoque",

  "dados_evento": {
    "reserva_id": "RES-PLAN-CLI-001-2024-03-17",
    "pedido_id": "PED-CLI-001-2024-03-17",
    "cliente_id": "CLI-001",
    "cliente_nome": "Vidraçaria Centro",
    "materiais_reservados": 2,
    "quantidade_total": 21.2,
    "status": "pronto_producao"
  }
}
```

### Dashboard Response
```json
{
  "evento_id": "EVT-MAT-RES-CLI-001-2024-03-17",
  "timestamp_processamento": "2024-03-17T10:11:31Z",

  "atualizacao_dashboard": {
    "secao": "pedidos_em_andamento",
    "elemento": "PED-CLI-001-2024-03-17",
    "novo_status": "Pronto para Produção ✓",
    "color_badge": "green",
    "notificacao_visual": true,
    "som_alerta": false,
    "tempo_atualizacao": 1000  // milliseconds
  }
}
```

---

## 📊 Resumo de Webhooks

| De | Para | Tipo | Freq. | SLA |
|----|----|------|------|-----|
| CRM | Producao | Validação tipologia | Sob demanda | 5min |
| CRM | Producao | Novo pedido | Sob demanda | 2min |
| Producao | Qualidade | Plano pronto | Sob demanda | 10min |
| Qualidade | Producao | Plano aprovado | Sob demanda | 2min |
| Producao | Estoque | Reservar material | Sob demanda | 2min |
| Estoque | Producao | Confirmação reserva | Sob demanda | 1min |
| Producao | Financeiro | Produção completa | Sob demanda | 5min |
| Financeiro | Integradores | NF-e pronta | Sob demanda | 30min |
| Integradores | Financeiro | SEFAZ confirmado | Sob demanda | 60min |
| Qualquer | Dashboard | Status update | Real-time | 5seg |

---

## 🔍 Monitoramento de Webhooks

```bash
# Verificar webhooks pendentes
curl http://orquestrador:4000/webhooks/pending

# Verificar histórico de execução
curl http://orquestrador:4000/webhooks/history?limit=100

# Reenviar webhook falhado
curl -X POST http://orquestrador:4000/webhooks/retry/webhook-id

# Ver logs de integração
curl http://orquestrador:4000/logs/webhooks?squad=squad-crm&limit=50
```

---

## 🚀 Implementação

1. ✅ Definir payloads (este documento)
2. → Implementar endpoints em cada squad
3. → Testar webhooks em staging
4. → Configurar retries e fallbacks
5. → Deploy em produção

---

*Documento: Webhook Payloads v1.0*
