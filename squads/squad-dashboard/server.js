#!/usr/bin/env node
/**
 * Squad Dashboard - Real-time Analytics
 * Porta: 3006
 */

const express = require('express');
const app = express();
app.use(express.json());

const eventos = [];
const metricas = {
  pedidos_total: 0,
  em_producao: 0,
  concluidos: 0,
  taxa_sucesso: 0
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', squad: 'squad-dashboard' });
});

// Receber Atualizações em Tempo Real
app.post('/update-status', (req, res) => {
  const { tipo_evento, pedido_id, status, squad_origem } = req.body;

  const evento = {
    id: `EVT-${Date.now()}`,
    tipo: tipo_evento,
    pedido_id,
    status,
    squad: squad_origem,
    timestamp: new Date().toISOString()
  };

  eventos.push(evento);

  // Atualizar métricas
  if (tipo_evento === 'novo_pedido') metricas.pedidos_total++;
  if (status === 'em_producao') metricas.em_producao++;
  if (status === 'concluido') metricas.concluidos++;

  metricas.taxa_sucesso = ((metricas.concluidos / metricas.pedidos_total) * 100).toFixed(1);

  console.log(`✓ Dashboard atualizado: ${tipo_evento} - ${pedido_id}`);
  res.json({ evento_id: evento.id, status: 'processado' });
});

// Status Geral
app.get('/status', (req, res) => {
  const dados = {
    timestamp: new Date().toISOString(),
    metricas,
    ultimos_eventos: eventos.slice(-10),
    squads: {
      'squad-producao': 'online',
      'squad-estoque': 'online',
      'squad-crm': 'online',
      'squad-financeiro': 'online',
      'squad-qualidade': 'online',
      'squad-integradores': 'online',
      'squad-dashboard': 'online'
    },
    saude_geral: 'excelente'
  };

  console.log(`✓ Status solicitado: ${metricas.pedidos_total} pedidos`);
  res.json(dados);
});

// Sinalize Alertas
app.post('/emit-alert', (req, res) => {
  const { tipo, severidade, mensagem } = req.body;

  const alerta = {
    id: `ALT-${Date.now()}`,
    tipo,
    severidade,
    mensagem,
    timestamp: new Date().toISOString()
  };

  console.log(`✓ Alerta emitido: [${severidade.toUpperCase()}] ${mensagem}`);
  res.json(alerta);
});

const PORT = process.env.PORT || 3006;
require('http').createServer(app).listen(PORT, () => {
  console.log(`\n📈 Squad-Dashboard iniciado na porta ${PORT}\n`);
});

module.exports = app;
