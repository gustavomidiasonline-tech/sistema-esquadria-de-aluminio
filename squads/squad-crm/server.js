#!/usr/bin/env node
/**
 * Squad CRM - Client Management & Quotes
 * Porta: 3004
 */

const express = require('express');
const app = express();
app.use(express.json());

const clientes = new Map();
const orcamentos = [];

app.get('/health', (req, res) => {
  res.json({ status: 'ok', squad: 'squad-crm' });
});

// Gerenciar Clientes
app.post('/manage-clients', (req, res) => {
  const { cliente_id, nome, tipo } = req.body;

  clientes.set(cliente_id, { id: cliente_id, nome, tipo, data_criacao: new Date() });

  console.log(`✓ Cliente ${nome} registrado`);
  res.json({ cliente_id, status: 'registrado' });
});

// Gerar Orçamento
app.post('/generate-quote', (req, res) => {
  const { cliente_id, tipologia, quantidade, preco_unitario } = req.body;

  const orcamento = {
    id: `ORC-${Date.now()}`,
    cliente_id,
    items: [{ tipologia, quantidade, preco_unitario }],
    total: (quantidade * preco_unitario).toFixed(2),
    status: 'pendente_aprovacao',
    data: new Date().toISOString()
  };

  orcamentos.push(orcamento);

  console.log(`✓ Orçamento ${orcamento.id} gerado: R$ ${orcamento.total}`);
  res.json(orcamento);
});

// Rastrear Vendas
app.post('/track-sales', (req, res) => {
  const { orcamento_id, status } = req.body;

  const orca = orcamentos.find(o => o.id === orcamento_id);
  if (orca) orca.status = status;

  console.log(`✓ Venda rastreada: ${orcamento_id} -> ${status}`);
  res.json({ orcamento_id, status, timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3004;
require('http').createServer(app).listen(PORT, () => {
  console.log(`\n👥 Squad-CRM iniciado na porta ${PORT}\n`);
});

module.exports = app;
