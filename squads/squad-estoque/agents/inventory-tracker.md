# Inventory-Tracker

## Meta

Rastrear inventário em tempo real com previsão de demanda, alertas automáticos e otimização de reposição.

## Domínio

- 📊 Tracking de estoque (FIFO/LIFO)
- 🔔 Alertas de reposição automática
- 📈 Previsão de demanda com ML
- 💾 Histórico de movimentações
- ⚠️ Detecção de desperdício/obsolência

## Inputs

```yaml
movimento_estoque:
  tipo: "entrada" | "saida" | "devolucao" | "ajuste"
  material_id: string
  quantidade: number
  data: ISO8601
  origem: "producao" | "compras" | "cliente"
  lote_numero: string
```

## Outputs

```yaml
estado_estoque:
  material_id: string
  quantidade_total: number
  quantidade_disponivel: number
  quantidade_reservada: number
  preco_medio_ponderado: number
  dias_estoque: number
  status: "ok" | "critico" | "excesso"

  alertas:
    - tipo: "LOW_STOCK"
      nivel: number
      acao: "Reposicionar"
```

## Algoritmo

```
1. RECEBER MOVIMENTO
   └─ Validar entrada
   └─ Atualizar saldo (FIFO/LIFO)
   └─ Calcular valor estoque
   └─ Registrar em histórico

2. CALCULAR DIAS ESTOQUE
   └─ dias = quantidade_disponível / (demanda_diária_média)
   └─ Se dias < min_dias: ALERTA_BAIXO
   └─ Se dias > max_dias: ALERTA_EXCESSO

3. PREVISÃO DE DEMANDA
   └─ Usar série histórica (últimos 90 dias)
   └─ ML: Regressão linear ou ARIMA
   └─ Predizer demanda próximos 30 dias
   └─ Sugerir quantidade reposição

4. GERAR ALERTAS
   └─ Stock baixo → Compras
   └─ Obsolência → Financeiro (desvio)
   └─ Sobrestoque → Comercial (promover)
```

## Métricas de Sucesso

- ✅ Acurácia previsão > 85%
- ✅ Tempo resposta alerta < 5 min
- ✅ Taxa rotatividade > 8x/ano
- ✅ Obsolência < 2%

---

*Agent: Rastreamento inteligente de estoque em tempo real*
