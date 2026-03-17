#!/bin/bash

echo "════════════════════════════════════════════════"
echo "🧪 TESTE 2: Pedido Grande (100 unidades)"
echo "════════════════════════════════════════════════"
curl -s -X POST http://localhost:4000/processar-pedido \
  -H "Content-Type: application/json" \
  -d '{
    "id": "PED-2024-002",
    "cliente_id": "CLI-002",
    "cliente_nome": "Vidraçaria Zona Leste",
    "tipologia": "janela-aluminio-6mm",
    "dimensoes": {"altura": 1200, "largura": 800},
    "quantidade": 100,
    "material": "aluminio_6063"
  }' | grep -o '"status":"[^"]*"' || echo "Processando..."

sleep 2

echo ""
echo "════════════════════════════════════════════════"
echo "🧪 TESTE 3: Pedido Premium (Diferentes dimensões)"
echo "════════════════════════════════════════════════"
curl -s -X POST http://localhost:4000/processar-pedido \
  -H "Content-Type: application/json" \
  -d '{
    "id": "PED-2024-003",
    "cliente_id": "CLI-003",
    "cliente_nome": "Construtora Premium",
    "tipologia": "fachada-vidro-integral",
    "dimensoes": {"altura": 3500, "largura": 2800},
    "quantidade": 5,
    "material": "vidro_temperado"
  }' | grep -o '"status":"[^"]*"' || echo "Processando..."

sleep 2

echo ""
echo "════════════════════════════════════════════════"
echo "📊 MONITORAMENTO FINAL"
echo "════════════════════════════════════════════════"
curl -s http://localhost:4000/status-squads | grep -o '"[^"]*":"[^"]*"' | head -10
