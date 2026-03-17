#!/usr/bin/env node
/**
 * Squad CRM - Client Management & Quotes
 * Porta: 3004
 *
 * Persistence: Supabase (via ../db-service.js)
 * Graceful fallback: in-memory Map/Array when Supabase is not configured.
 */

'use strict';

const express = require('express');
const app = express();
app.use(express.json());

// ─── Persistence layer ────────────────────────────────────────────────────────

const db = require('../db-service');

// ─── In-memory fallback ───────────────────────────────────────────────────────

const _memClientes   = new Map();   // externalId → row
const _memOrcamentos = [];          // { id, cliente_id, ... }

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    squad: 'squad-crm',
    persistence: db.isConfigured() ? 'supabase' : 'in-memory',
  });
});

// ─── Gerenciar Clientes ───────────────────────────────────────────────────────

app.post('/manage-clients', async (req, res) => {
  const { cliente_id, nome, tipo } = req.body;

  try {
    if (db.isConfigured()) {
      // Map external cliente_id to observacoes for traceability
      const row = {
        nome,
        observacoes: JSON.stringify({ external_id: cliente_id, tipo }),
      };
      const { data, error } = await db.clientes.upsert(row);
      if (error) {
        console.error('[manage-clients] Supabase error:', error.message);
        // Fall through to in-memory
      } else {
        console.log(`✓ Cliente ${nome} registrado (Supabase id: ${data.id})`);
        return res.json({ cliente_id, supabase_id: data.id, status: 'registrado' });
      }
    }

    // In-memory fallback
    _memClientes.set(cliente_id, { id: cliente_id, nome, tipo, data_criacao: new Date() });
    console.log(`✓ Cliente ${nome} registrado (in-memory)`);
    res.json({ cliente_id, status: 'registrado' });
  } catch (err) {
    console.error('[manage-clients] Error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ─── Listar Clientes ──────────────────────────────────────────────────────────

app.get('/clientes', async (req, res) => {
  try {
    if (db.isConfigured()) {
      const { data, error } = await db.clientes.findAll();
      if (!error) return res.json({ clientes: data, total: data.length });
    }
    const list = Array.from(_memClientes.values());
    res.json({ clientes: list, total: list.length });
  } catch (err) {
    console.error('[clientes] Error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ─── Gerar Orçamento ──────────────────────────────────────────────────────────

app.post('/generate-quote', async (req, res) => {
  const { cliente_id, tipologia, quantidade, preco_unitario } = req.body;
  const total = (quantidade * preco_unitario).toFixed(2);

  try {
    if (db.isConfigured()) {
      // Resolve Supabase cliente UUID from the first client matching the external id
      const { data: allClientes } = await db.from('clientes')
        .select('id, observacoes')
        .ilike('observacoes', `%${cliente_id}%`)
        .limit(1);

      const supabaseClienteId = allClientes && allClientes.length > 0
        ? allClientes[0].id
        : null;

      const row = {
        cliente_id:  supabaseClienteId || undefined,
        descricao:   `${tipologia} x${quantidade}`,
        valor_total: parseFloat(total),
        status:      'rascunho',
        observacoes: JSON.stringify({ tipologia, quantidade, preco_unitario }),
      };

      const { data, error } = await db.orcamentos.create(row);

      if (!error && data) {
        console.log(`✓ Orçamento ${data.id} gerado: R$ ${total} (Supabase)`);
        return res.json({
          id:          data.id,
          cliente_id,
          items:       [{ tipologia, quantidade, preco_unitario }],
          total,
          status:      'pendente_aprovacao',
          data:        data.created_at,
        });
      }
      console.error('[generate-quote] Supabase error:', error?.message);
    }

    // In-memory fallback
    const orcamento = {
      id:       `ORC-${Date.now()}`,
      cliente_id,
      items:    [{ tipologia, quantidade, preco_unitario }],
      total,
      status:   'pendente_aprovacao',
      data:     new Date().toISOString(),
    };
    _memOrcamentos.push(orcamento);

    console.log(`✓ Orçamento ${orcamento.id} gerado: R$ ${total} (in-memory)`);
    res.json(orcamento);
  } catch (err) {
    console.error('[generate-quote] Error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ─── Listar Orçamentos ────────────────────────────────────────────────────────

app.get('/orcamentos', async (req, res) => {
  try {
    if (db.isConfigured()) {
      const { data, error } = await db.orcamentos.findAll();
      if (!error) return res.json({ orcamentos: data, total: data.length });
    }
    res.json({ orcamentos: _memOrcamentos, total: _memOrcamentos.length });
  } catch (err) {
    console.error('[orcamentos] Error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ─── Rastrear Vendas ──────────────────────────────────────────────────────────

app.post('/track-sales', async (req, res) => {
  const { orcamento_id, status } = req.body;

  try {
    if (db.isConfigured()) {
      const { data, error } = await db.orcamentos.updateStatus(orcamento_id, status);
      if (!error && data) {
        console.log(`✓ Venda rastreada: ${orcamento_id} -> ${status} (Supabase)`);
        return res.json({ orcamento_id, status, timestamp: new Date().toISOString() });
      }
      console.error('[track-sales] Supabase error:', error?.message);
    }

    // In-memory fallback
    const orca = _memOrcamentos.find(o => o.id === orcamento_id);
    if (orca) orca.status = status;

    console.log(`✓ Venda rastreada: ${orcamento_id} -> ${status} (in-memory)`);
    res.json({ orcamento_id, status, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[track-sales] Error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3004;
require('http').createServer(app).listen(PORT, () => {
  console.log(`\n👥 Squad-CRM iniciado na porta ${PORT}`);
  console.log(`   Persistence: ${db.isConfigured() ? 'Supabase PostgreSQL' : 'In-Memory (fallback)'}`);
  console.log(`   Endpoints:`);
  console.log(`   - POST /manage-clients`);
  console.log(`   - GET  /clientes`);
  console.log(`   - POST /generate-quote`);
  console.log(`   - GET  /orcamentos`);
  console.log(`   - POST /track-sales\n`);
});

module.exports = app;
