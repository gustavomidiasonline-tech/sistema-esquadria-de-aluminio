#!/bin/bash

echo "🧪 TESTE COMPLETO: 3 Pedidos + Sincronização de Estoque"
echo "════════════════════════════════════════════════════════"

echo ""
echo "📋 [1/4] PEDIDO 1: Padrão (10 unidades)"
curl -s -X POST http://localhost:4000/processar-pedido \
  -H "Content-Type: application/json" \
  -d '{"id":"PED-001","cliente_id":"CLI-001","cliente_nome":"Vidraçaria Centro","tipologia":"porta-correr-premium","dimensoes":{"altura":2100,"largura":1500},"quantidade":10,"material":"aluminio_6063"}' | grep -o '"status":"[^"]*"'

echo ""
echo "📋 [2/4] PEDIDO 2: Grande (100 unidades)"
curl -s -X POST http://localhost:4000/processar-pedido \
  -H "Content-Type: application/json" \
  -d '{"id":"PED-002","cliente_id":"CLI-002","cliente_nome":"Vidraçaria Zona Leste","tipologia":"janela-aluminio-6mm","dimensoes":{"altura":1200,"largura":800},"quantidade":100,"material":"aluminio_6063"}' | grep -o '"status":"[^"]*"'

echo ""
echo "📋 [3/4] PEDIDO 3: Premium (5 unidades vidro temperado)"
curl -s -X POST http://localhost:4000/processar-pedido \
  -H "Content-Type: application/json" \
  -d '{"id":"PED-003","cliente_id":"CLI-003","cliente_nome":"Construtora Premium","tipologia":"fachada-vidro-integral","dimensoes":{"altura":3500,"largura":2800},"quantidade":5,"material":"vidro_temperado"}' | grep -o '"status":"[^"]*"'

echo ""
echo "🔄 [4/4] SINCRONIZANDO ESTOQUE COM FORNECEDORES"
curl -s -X POST http://localhost:3003/sincronizar-estoque -H "Content-Type: application/json" -d '{}' | head -c 200
echo ""

echo ""
echo "════════════════════════════════════════════════════════"
echo "📊 STATUS FINAL DO ESTOQUE:"
curl -s http://localhost:3003/status-estoque | grep -o '"status":"[^"]*"' || curl -s http://localhost:3003/status-estoque | head -c 300
