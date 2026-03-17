#!/bin/bash

# ============================================================================
#  QUICK START — Sistema ERP Alumínio & Vidraçarias
#  Comece em < 2 minutos
# ============================================================================

set -e  # Exit on error

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║    🚀  SISTEMA ERP ALUMÍNIO & VIDRAÇARIAS 🚀             ║"
echo "║                                                           ║"
echo "║      Quick Start — Deploy em 2 minutos                   ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
echo "🔍 Verificando pré-requisitos..."

if ! command -v node &> /dev/null; then
  echo "❌ Node.js não instalado. Instale em https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION"

if ! command -v npm &> /dev/null; then
  echo "❌ npm não instalado"
  exit 1
fi

echo "✓ npm instalado"
echo ""

# Install dependencies
echo "📦 Instalando dependências..."
if [ ! -d "node_modules" ]; then
  npm install --silent
  echo "✓ Dependências instaladas"
else
  echo "✓ Dependências já instaladas"
fi
echo ""

# Check environment file
echo "⚙️  Verificando configuração..."
if [ ! -f ".env" ]; then
  echo "⚠️  Arquivo .env não encontrado. Criando a partir de .env.example..."
  cp .env.example .env
  echo "✓ Arquivo .env criado"
else
  echo "✓ Arquivo .env presente"
fi
echo ""

# Start services
echo "🎯 Iniciando 8 serviços..."
echo ""

# Background the node process
node start-all-squads.js &
PROCESS_ID=$!

# Wait for services to boot
echo "⏳ Aguardando serviços iniciarem..."
for i in {1..10}; do
  if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "✓ Orquestrador online"
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

# Health check all services
echo "🏥 Verificando saúde dos serviços..."
echo ""

SUCCESS=0
for port in 3002 3003 3004 3005 3006 3007 3008 4000; do
  if curl -s "http://localhost:$port/health" | grep -q '"status":"ok"'; then
    SERVICE_NAME=""
    case $port in
      3002) SERVICE_NAME="squad-producao" ;;
      3003) SERVICE_NAME="squad-estoque" ;;
      3004) SERVICE_NAME="squad-crm" ;;
      3005) SERVICE_NAME="squad-financeiro" ;;
      3006) SERVICE_NAME="squad-dashboard" ;;
      3007) SERVICE_NAME="squad-qualidade" ;;
      3008) SERVICE_NAME="squad-integradores" ;;
      4000) SERVICE_NAME="orquestrador" ;;
    esac
    echo "  ✓ :$port — $SERVICE_NAME"
    ((SUCCESS++))
  else
    echo "  ✗ :$port — OFFLINE"
  fi
done

echo ""
if [ $SUCCESS -eq 8 ]; then
  echo "✅ TODOS OS 8 SERVIÇOS ONLINE"
else
  echo "⚠️  $SUCCESS/8 serviços online"
fi
echo ""

# Display endpoints
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║            📊 SISTEMA ONLINE — USE ASSIM:                ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Health Check (público):"
echo "  curl http://localhost:4000/health"
echo ""
echo "Status de Squads (público):"
echo "  curl http://localhost:4000/status-squads"
echo ""
echo "Registrar usuário (público):"
echo "  curl -X POST http://localhost:4000/auth/register \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"user@example.com\",\"password\":\"senha\"}'"
echo ""
echo "Login (público):"
echo "  curl -X POST http://localhost:4000/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"admin@pixel-perfect.local\",\"password\":\"Admin@2026!\"}'"
echo ""
echo "Processar pedido (requer token):"
echo "  curl -X POST http://localhost:4000/processar-pedido \\"
echo "    -H 'Authorization: Bearer <token>' \\"
echo "    -d '{\"id\":\"PED-001\",...}'"
echo ""

# Instructions
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║                  📚 PRÓXIMOS PASSOS                      ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "1️⃣  Teste a saúde do sistema:"
echo "   curl http://localhost:4000/health"
echo ""
echo "2️⃣  Leia a documentação:"
echo "   cat SETUP-GUIDE.md"
echo "   cat DEPLOYMENT-READY.md"
echo ""
echo "3️⃣  Para parar os serviços:"
echo "   Press Ctrl+C"
echo ""
echo "4️⃣  Para Docker deployment:"
echo "   docker-compose up -d"
echo ""
echo "Sistema ERP rodando em:"
echo "  📍 http://localhost:4000 (Orquestrador)"
echo ""
echo "Ctrl+C para parar os serviços"
echo ""

# Keep process running
wait $PROCESS_ID
