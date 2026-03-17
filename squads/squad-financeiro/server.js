#!/usr/bin/env node
/**
 * Squad Financeiro - Financial Control & NF-e
 * Porta: 3005
 */

const express = require('express');
const app = express();
app.use(express.json());

const nfes = [];
const vendas = [];

app.get('/health', (req, res) => {
  res.json({ status: 'ok', squad: 'squad-financeiro' });
});

// Processar Invoice (Gerar NF-e)
app.post('/process-invoice', (req, res) => {
  const { pedido_id, valor, cliente } = req.body;

  const nfe = {
    id: `NF-${Date.now()}`,
    numero: Math.floor(Math.random() * 100000),
    pedido_id,
    valor,
    cliente,
    status: 'emitida',
    data_emissao: new Date().toISOString(),
    xml: `<nfe><id>${pedido_id}</id><valor>${valor}</valor></nfe>`
  };

  nfes.push(nfe);

  console.log(`✓ NF-e ${nfe.numero} emitida para pedido ${pedido_id}`);

  // Webhook para integradores
  fetch('http://squad-integradores:3008/process-nfe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nfe)
  }).catch(() => {});

  res.json({ nfe_id: nfe.id, numero: nfe.numero, status: 'emitida' });
});

// Gerenciar Finanças (DRE, Fluxo)
app.post('/manage-finances', (req, res) => {
  const { tipo, valor, descricao } = req.body;

  vendas.push({ tipo, valor, descricao, data: new Date() });

  const receita = vendas.filter(v => v.tipo === 'receita').reduce((a,v) => a + v.valor, 0);
  const despesa = vendas.filter(v => v.tipo === 'despesa').reduce((a,v) => a + v.valor, 0);

  console.log(`✓ Movimento financeiro registrado`);
  res.json({
    receita_total: receita,
    despesa_total: despesa,
    lucro: (receita - despesa).toFixed(2),
    movimentos: vendas.length
  });
});

// Gerar Relatórios (DRE, Fluxo de Caixa)
app.post('/generate-reports', (req, res) => {
  const { tipo } = req.body;

  const receita = vendas.filter(v => v.tipo === 'receita').reduce((a,v) => a + v.valor, 0);
  const despesa = vendas.filter(v => v.tipo === 'despesa').reduce((a,v) => a + v.valor, 0);
  const lucro = receita - despesa;

  const dre = {
    tipo: 'DRE',
    periodo: 'Março 2024',
    receita_bruta: receita.toFixed(2),
    despesas: despesa.toFixed(2),
    lucro_liquido: lucro.toFixed(2),
    margem: ((lucro / receita) * 100).toFixed(2) + '%'
  };

  console.log(`✓ Relatório ${tipo} gerado`);
  res.json(dre);
});

const PORT = process.env.PORT || 3005;
require('http').createServer(app).listen(PORT, () => {
  console.log(`\n💰 Squad-Financeiro iniciado na porta ${PORT}\n`);
});

module.exports = app;
