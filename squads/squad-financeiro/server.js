#!/usr/bin/env node
/**
 * Squad Financeiro - Financial Control & NF-e
 * Porta: 3005
 *
 * Persistence: Supabase (via ../db-service.js)
 * Graceful fallback: in-memory arrays when Supabase is not configured.
 */

'use strict';

const express = require('express');
const app = express();
app.use(express.json());

// ─── Persistence layer ────────────────────────────────────────────────────────

const db = require('../db-service');

// ─── In-memory fallback ───────────────────────────────────────────────────────

const _memNfes   = [];
const _memVendas = [];

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    squad: 'squad-financeiro',
    persistence: db.isConfigured() ? 'supabase' : 'in-memory',
  });
});

// ─── Processar Invoice (Gerar NF-e) ──────────────────────────────────────────

app.post('/process-invoice', async (req, res) => {
  const { pedido_id, valor, cliente } = req.body;

  try {
    const nfe = {
      id:           `NF-${Date.now()}`,
      numero:       Math.floor(Math.random() * 100000),
      pedido_id,
      valor,
      cliente,
      status:       'emitida',
      data_emissao: new Date().toISOString(),
      xml:          `<nfe><id>${pedido_id}</id><valor>${valor}</valor></nfe>`,
    };

    if (db.isConfigured()) {
      // Persist as a venda (receita) linked to the pedido
      await db.vendas.create({
        pedido_id: undefined,   // pedido_id from squad is a string, not UUID — keep null
        tipo:      'receita',
        valor:     parseFloat(valor) || 0,
        descricao: `NF-e ${nfe.numero} — ${cliente}`,
      });
    } else {
      _memNfes.push(nfe);
    }

    console.log(`✓ NF-e ${nfe.numero} emitida para pedido ${pedido_id}`);

    // Webhook para integradores (fire-and-forget)
    fetch('http://squad-integradores:3008/process-nfe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(nfe),
    }).catch(() => {});

    res.json({ nfe_id: nfe.id, numero: nfe.numero, status: 'emitida' });
  } catch (err) {
    console.error('[process-invoice] Error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ─── Gerenciar Finanças (DRE, Fluxo) ─────────────────────────────────────────

app.post('/manage-finances', async (req, res) => {
  const { tipo, valor, descricao } = req.body;

  try {
    if (db.isConfigured()) {
      await db.vendas.create({ tipo, valor: parseFloat(valor) || 0, descricao });
      const totais = await db.vendas.sumByTipo();
      const receita = totais.receita;
      const despesa = totais.despesa;

      console.log(`✓ Movimento financeiro registrado (Supabase)`);
      return res.json({
        receita_total:  receita,
        despesa_total:  despesa,
        lucro:          (receita - despesa).toFixed(2),
        persistence:    'supabase',
      });
    }

    // In-memory fallback
    _memVendas.push({ tipo, valor, descricao, data: new Date() });

    const receita = _memVendas.filter(v => v.tipo === 'receita').reduce((a, v) => a + v.valor, 0);
    const despesa = _memVendas.filter(v => v.tipo === 'despesa').reduce((a, v) => a + v.valor, 0);

    console.log(`✓ Movimento financeiro registrado (in-memory)`);
    res.json({
      receita_total: receita,
      despesa_total: despesa,
      lucro:         (receita - despesa).toFixed(2),
      movimentos:    _memVendas.length,
    });
  } catch (err) {
    console.error('[manage-finances] Error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ─── Gerar Relatórios (DRE, Fluxo de Caixa) ──────────────────────────────────

app.post('/generate-reports', async (req, res) => {
  const { tipo } = req.body;

  try {
    let receita = 0;
    let despesa = 0;

    if (db.isConfigured()) {
      const totais = await db.vendas.sumByTipo();
      receita = totais.receita;
      despesa = totais.despesa;
    } else {
      receita = _memVendas.filter(v => v.tipo === 'receita').reduce((a, v) => a + v.valor, 0);
      despesa = _memVendas.filter(v => v.tipo === 'despesa').reduce((a, v) => a + v.valor, 0);
    }

    const lucro = receita - despesa;
    const margem = receita > 0 ? ((lucro / receita) * 100).toFixed(2) + '%' : '0.00%';

    const dre = {
      tipo:           'DRE',
      periodo:        new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
      receita_bruta:  receita.toFixed(2),
      despesas:       despesa.toFixed(2),
      lucro_liquido:  lucro.toFixed(2),
      margem,
      persistence:    db.isConfigured() ? 'supabase' : 'in-memory',
    };

    console.log(`✓ Relatório ${tipo} gerado`);
    res.json(dre);
  } catch (err) {
    console.error('[generate-reports] Error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3005;
require('http').createServer(app).listen(PORT, () => {
  console.log(`\n💰 Squad-Financeiro iniciado na porta ${PORT}`);
  console.log(`   Persistence: ${db.isConfigured() ? 'Supabase PostgreSQL' : 'In-Memory (fallback)'}`);
  console.log(`   Endpoints:`);
  console.log(`   - POST /process-invoice`);
  console.log(`   - POST /manage-finances`);
  console.log(`   - POST /generate-reports\n`);
});

module.exports = app;
