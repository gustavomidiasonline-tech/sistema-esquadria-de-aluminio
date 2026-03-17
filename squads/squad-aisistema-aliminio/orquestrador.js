#!/usr/bin/env node
/**
 * ORQUESTRADOR CENTRAL - Brain do Sistema ERP
 * Coordena todos os 7 squads
 * Porta: 4000
 */

const express = require('express');
const app = express();
app.use(express.json());

// Configuração de squads
const SQUADS = {
  'producao': 'http://squad-producao:3002',
  'estoque': 'http://squad-estoque:3003',
  'crm': 'http://squad-crm:3004',
  'financeiro': 'http://squad-financeiro:3005',
  'dashboard': 'http://squad-dashboard:3006',
  'qualidade': 'http://squad-qualidade:3007',
  'integradores': 'http://squad-integradores:3008'
};

const processosEmExecutacao = new Map();

// ============================================================================
// ORQUESTRADOR
// ============================================================================

class Orquestrador {
  async procesarPedido(pedido) {
    const processId = `PROC-${Date.now()}`;
    processosEmExecutacao.set(processId, { status: 'iniciando', pedido });

    try {
      console.log(`\n🎯 === INICIANDO PROCESSAMENTO DO PEDIDO ${pedido.id} ===\n`);

      // PASSO 1: CRM valida tipologia
      console.log(`[1/7] CRM: Validando tipologia...`);
      const tipologiaValida = await this.chamarSquad('crm', 'POST', '/manage-clients', {
        cliente_id: pedido.cliente_id,
        nome: pedido.cliente_nome,
        tipo: 'comercial'
      });

      // PASSO 2: Producao cria plano de corte
      console.log(`[2/7] Producao: Criando plano de corte...`);
      const planoCorte = await this.chamarSquad('producao', 'POST', '/create-cutting-plan', {
        pedidos: [{
          dimensoes: pedido.dimensoes,
          quantidade: pedido.quantidade,
          material: pedido.material
        }]
      });

      processosEmExecutacao.get(processId).plano = planoCorte;

      // PASSO 3: Qualidade valida plano
      console.log(`[3/7] Qualidade: Validando plano...`);
      const validacaoQA = await this.chamarSquad('qualidade', 'POST', '/validate-cutting-plan', {
        plano_id: planoCorte.plano_id,
        eficiencia: planoCorte.eficiencia,
        status: planoCorte.status
      });

      if (validacaoQA.resultado !== 'aprovado') {
        throw new Error('Plano rejeitado pela QA');
      }

      // PASSO 4: Estoque reserva material
      console.log(`[4/7] Estoque: Reservando material...`);
      const reserva = await this.chamarSquad('estoque', 'POST', '/reserve-material', {
        reserva_id: `RES-${planoCorte.plano_id}`,
        materiais_para_reservar: [
          {
            material_id: 'aluminio_6063',
            quantidade: 12,
            unidade: 'm²'
          }
        ]
      });

      // PASSO 5: CRM gera orçamento
      console.log(`[5/7] CRM: Gerando orçamento...`);
      const orcamento = await this.chamarSquad('crm', 'POST', '/generate-quote', {
        cliente_id: pedido.cliente_id,
        tipologia: pedido.tipologia,
        quantidade: pedido.quantidade,
        preco_unitario: 455
      });

      // PASSO 6: Financeiro registra venda
      console.log(`[6/7] Financeiro: Registrando operação...`);
      const financeiro = await this.chamarSquad('financeiro', 'POST', '/manage-finances', {
        tipo: 'receita',
        valor: parseFloat(orcamento.total),
        descricao: `Venda ${pedido.id}`
      });

      // PASSO 7: Dashboard atualiza
      console.log(`[7/7] Dashboard: Atualizando status...`);
      await this.chamarSquad('dashboard', 'POST', '/update-status', {
        tipo_evento: 'pedido_processado',
        pedido_id: pedido.id,
        status: 'pronto_producao',
        squad_origem: 'orquestrador'
      });

      processosEmExecutacao.get(processId).status = 'completo';

      console.log(`\n✅ === PEDIDO ${pedido.id} PROCESSADO COM SUCESSO ===\n`);

      return {
        processo_id: processId,
        status: 'sucesso',
        pedido_id: pedido.id,
        plano: planoCorte,
        orcamento: orcamento,
        financeiro: financeiro,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      processosEmExecutacao.get(processId).status = 'erro';
      console.error(`\n❌ === ERRO PROCESSANDO PEDIDO ${pedido.id} ===`);
      console.error(`Erro: ${error.message}\n`);

      // Webhook para dashboard
      await this.chamarSquad('dashboard', 'POST', '/emit-alert', {
        tipo: 'pedido_erro',
        severidade: 'alta',
        mensagem: `Erro processando pedido ${pedido.id}: ${error.message}`
      }).catch(() => {});

      throw error;
    }
  }

  async chamarSquad(squad, metodo, endpoint, payload) {
    const url = `${SQUADS[squad]}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`${squad} retornou ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error(`   ❌ Erro ao chamar ${squad}: ${error.message}`);
      throw error;
    }
  }
}

const orquestrador = new Orquestrador();

// ============================================================================
// ENDPOINTS
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    squad: 'orquestrador',
    squads_monitorados: Object.keys(SQUADS).length,
    processos_ativos: processosEmExecutacao.size
  });
});

// Processar Pedido Completo
app.post('/processar-pedido', async (req, res) => {
  try {
    const resultado = await orquestrador.procesarPedido(req.body);
    res.json(resultado);

  } catch (error) {
    res.status(500).json({
      status: 'erro',
      mensagem: error.message,
      pedido_id: req.body.id
    });
  }
});

// Status do Processo
app.get('/status/:processId', (req, res) => {
  const proc = processosEmExecutacao.get(req.params.processId);

  if (!proc) {
    return res.status(404).json({ erro: 'Processo não encontrado' });
  }

  res.json(proc);
});

// Health de todos os squads
app.get('/status-squads', async (req, res) => {
  const status = {};

  for (const [name, url] of Object.entries(SQUADS)) {
    try {
      const response = await fetch(`${url}/health`);
      status[name] = response.ok ? 'online' : 'offline';
    } catch {
      status[name] = 'offline';
    }
  }

  res.json({
    timestamp: new Date().toISOString(),
    squads: status,
    total_online: Object.values(status).filter(s => s === 'online').length,
    total: Object.values(status).length
  });
});

// ============================================================================
// INICIAR
// ============================================================================

const PORT = process.env.PORT || 4000;
require('http').createServer(app).listen(PORT, () => {
  console.log(`\n🎯 === ORQUESTRADOR CENTRAL INICIADO ===`);
  console.log(`\nPorta: ${PORT}`);
  console.log(`Squads conectados:`);
  Object.entries(SQUADS).forEach(([name, url]) => {
    console.log(`  ✓ ${name.padEnd(15)} -> ${url}`);
  });
  console.log(`\nEndpoints:`);
  console.log(`  POST /processar-pedido`);
  console.log(`  GET /status-squads`);
  console.log(`  GET /health\n`);
});

module.exports = app;
