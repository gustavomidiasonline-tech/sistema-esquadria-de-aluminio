#!/usr/bin/env node
/**
 * Squad Estoque - Inventory Management & Catalogs
 * Porta: 3003
 *
 * Persistence: Supabase (via ../db-service.js)
 * Graceful fallback: in-memory Maps when Supabase is not configured.
 */

'use strict';

const express = require('express');
const app = express();
app.use(express.json());

// ─── Persistence layer ────────────────────────────────────────────────────────

const db = require('../db-service');

// ─── In-memory fallback (used only when Supabase is not configured) ───────────

const _memInventario = {
  aluminio_6063:   { quantidade: 500, minimo: 50,  unidade: 'm²',      status: 'ok', fornecedor: 'Aluma Brasil' },
  vidro_temperado: { quantidade: 300, minimo: 30,  unidade: 'unidades', status: 'ok', fornecedor: 'Vidraria Premium' },
};
const _memReservas         = [];
const _memSincronizacoes   = [];
const _memMovimentacoes    = [];

/**
 * Read inventory for a material — prefers Supabase, falls back to in-memory.
 */
async function getInventarioItem(materialId) {
  if (db.isConfigured()) {
    const { data, error } = await db.inventario.findById(materialId);
    if (!error && data) return data;
  }
  return _memInventario[materialId] || null;
}

/**
 * Update quantity in Supabase or in-memory.
 */
async function applyQuantityDelta(materialId, delta) {
  if (db.isConfigured()) {
    return db.inventario.applyDelta(materialId, delta);
  }
  if (_memInventario[materialId]) {
    _memInventario[materialId].quantidade += delta;
    return { data: _memInventario[materialId], error: null };
  }
  return { data: null, error: { message: `Material ${materialId} not found` } };
}

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    squad: 'squad-estoque',
    persistence: db.isConfigured() ? 'supabase' : 'in-memory',
    timestamp: new Date().toISOString(),
  });
});

// ─── Rastrear Inventário ──────────────────────────────────────────────────────

app.post('/track-inventory', async (req, res) => {
  const { material_id, quantidade, tipo } = req.body;

  try {
    const delta = tipo === 'entrada' ? quantidade : -quantidade;
    const { data: updated, error } = await applyQuantityDelta(material_id, delta);

    if (error) {
      return res.status(404).json({ erro: error.message });
    }

    const item = updated || await getInventarioItem(material_id);
    const diasEstoque = (item.quantidade || 0) / 2;
    const alerta = diasEstoque < (item.minimo || 0);

    // Log movement
    const movRow = {
      material_id,
      tipo,
      quantidade: Math.abs(quantidade),
      quantidade_nova: item.quantidade,
    };
    if (db.isConfigured()) {
      await db.movimentacoes.create(movRow);
    } else {
      _memMovimentacoes.push({ ...movRow, created_at: new Date().toISOString() });
    }

    console.log(`✓ Inventário atualizado: ${material_id}`);
    res.json({
      material_id,
      saldo_novo: item.quantidade,
      dias_estoque: diasEstoque,
      alerta_reposicao: alerta ? 'SIM' : 'NAO',
    });
  } catch (err) {
    console.error('[track-inventory] Error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ─── Reservar Material ────────────────────────────────────────────────────────

app.post('/reserve-material', async (req, res) => {
  const { reserva_id, materiais_para_reservar } = req.body;

  try {
    const resultados = [];

    for (const mat of materiais_para_reservar) {
      const item = await getInventarioItem(mat.material_id);
      const disponivel = item && item.quantidade >= mat.quantidade;

      if (disponivel) {
        // Deduct from inventory
        await applyQuantityDelta(mat.material_id, -mat.quantidade);

        // Persist reservation
        const reservaRow = {
          reserva_id,
          material_id: mat.material_id,
          quantidade: mat.quantidade,
          status: 'ativa',
        };
        if (db.isConfigured()) {
          await db.reservas.create(reservaRow);
        } else {
          _memReservas.push({ ...reservaRow, id: `MEM-${Date.now()}` });
        }
      }

      const itemAfter = await getInventarioItem(mat.material_id);
      resultados.push({
        material_id:       mat.material_id,
        status:            disponivel ? 'reservado' : 'insuficiente',
        quantidade_reservada: mat.quantidade,
        disponivel_pos:    itemAfter?.quantidade ?? 0,
      });
    }

    console.log(`✓ Reserva processada: ${reserva_id}`);
    res.json({ reserva_id, status: 'reservado', materiais: resultados });
  } catch (err) {
    console.error('[reserve-material] Error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ─── Gerenciar Catálogo ───────────────────────────────────────────────────────

app.post('/manage-catalog', (req, res) => {
  const { tipo, sku, preco } = req.body;

  // Catalog management is handled by the frontend via Supabase directly.
  // This endpoint is kept for squad-to-squad compatibility.
  console.log(`✓ Catálogo atualizado: ${tipo} ${sku}`);
  res.json({
    operacao:  tipo,
    sku,
    preco,
    status:    'ok',
    timestamp: new Date().toISOString(),
  });
});

// ─── Alertas de Reposição ─────────────────────────────────────────────────────

app.post('/alert-low-stock', async (req, res) => {
  try {
    let items = [];

    if (db.isConfigured()) {
      const { data, error } = await db.inventario.findAll();
      if (!error && data) items = data;
    } else {
      items = Object.entries(_memInventario).map(([id, mat]) => ({
        material_id: id, ...mat,
      }));
    }

    const alertas = items
      .filter(mat => mat.quantidade < mat.minimo)
      .map(mat => ({
        material_id:       mat.material_id || mat.id,
        quantidade_atual:  mat.quantidade,
        quantidade_minima: mat.minimo,
        quantidade_faltante: mat.minimo - mat.quantidade,
        urgencia: 'alta',
      }));

    console.log(`✓ Verificação de alertas completa (${alertas.length} alertas)`);
    res.json({ alertas, total: alertas.length });
  } catch (err) {
    console.error('[alert-low-stock] Error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ─── Verificar Reserva ────────────────────────────────────────────────────────

app.get('/verificar-reserva', async (req, res) => {
  const { plano } = req.query;

  try {
    let encontrada = false;
    let total = 0;

    if (db.isConfigured()) {
      const { data } = await db.from('reservas').select('reserva_id').ilike('reserva_id', `%${plano}%`);
      encontrada = (data && data.length > 0);
      const { count } = await db.reservas.countAll();
      total = count || 0;
    } else {
      encontrada = _memReservas.some(r => r.reserva_id.includes(plano));
      total = _memReservas.length;
    }

    res.json({ plano, reservado: encontrada, total_reservas: total });
  } catch (err) {
    console.error('[verificar-reserva] Error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ─── Sincronizar Estoque com Fornecedores ─────────────────────────────────────

app.post('/sincronizar-estoque', async (req, res) => {
  const sincId    = `SINC-${Date.now()}`;
  const timestamp = new Date().toISOString();

  try {
    let items = [];

    if (db.isConfigured()) {
      const { data, error } = await db.inventario.findAll();
      if (!error && data) items = data;
    } else {
      items = Object.entries(_memInventario).map(([id, mat]) => ({
        material_id: id, ...mat,
      }));
    }

    const verificacoes   = [];
    const reabastecimentos = [];

    for (const material of items) {
      const materialId = material.material_id || material.id;
      const verificacao = {
        material_id:     materialId,
        quantidade_atual: material.quantidade,
        minimo:           material.minimo,
        status:           'verificado',
      };

      if (material.quantidade < material.minimo) {
        const qtdReabastecer = material.minimo * 5;
        const qtdAnterior    = material.quantidade;

        await applyQuantityDelta(materialId, qtdReabastecer);

        const movRow = {
          material_id:         materialId,
          tipo:                'reabastecimento',
          quantidade:          qtdReabastecer,
          quantidade_anterior: qtdAnterior,
          quantidade_nova:     qtdAnterior + qtdReabastecer,
          fornecedor:          material.fornecedor,
        };

        if (db.isConfigured()) {
          await db.movimentacoes.create(movRow);
        } else {
          _memMovimentacoes.push({ ...movRow, created_at: timestamp });
        }

        reabastecimentos.push({
          material_id:       materialId,
          quantidade_anterior: qtdAnterior,
          quantidade_nova:   qtdAnterior + qtdReabastecer,
          quantidade_reabastecer: qtdReabastecer,
          fornecedor:        material.fornecedor,
          status:            'reabastecido',
        });

        verificacao.status = 'reabastecido';
      }

      verificacoes.push(verificacao);
    }

    // Log sync
    const sincRow = {
      sinc_id:                 sincId,
      materiais_verificados:   items.length,
      materiais_reabastecidos: reabastecimentos.length,
      status:                  'completa',
    };

    if (db.isConfigured()) {
      await db.sincronizacoes.create(sincRow);
    } else {
      _memSincronizacoes.push({ ...sincRow, created_at: timestamp });
    }

    console.log(`✓ Sincronização ${sincId} completada: ${reabastecimentos.length} materiais reabastecidos`);

    res.json({
      sinc_id:          sincId,
      timestamp,
      verificacoes,
      reabastecimentos,
      status:           'sucesso',
      total_operacoes:  reabastecimentos.length,
    });
  } catch (err) {
    console.error('[sincronizar-estoque] Error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ─── Status do Estoque ────────────────────────────────────────────────────────

app.get('/status-estoque', async (req, res) => {
  try {
    let items = [];

    if (db.isConfigured()) {
      const { data } = await db.inventario.findAll();
      if (data) items = data;
    } else {
      items = Object.entries(_memInventario).map(([id, mat]) => ({
        material_id: id, ...mat,
      }));
    }

    const resumo = items.map(mat => ({
      material_id:        mat.material_id || mat.id,
      quantidade_atual:   mat.quantidade,
      minimo:             mat.minimo,
      percentual_ocupacao: Math.round((mat.quantidade / (mat.minimo * 5)) * 100),
      status: mat.quantidade < mat.minimo
        ? 'BAIXO'
        : mat.quantidade < mat.minimo * 2 ? 'ATENCAO' : 'OK',
      fornecedor: mat.fornecedor,
    }));

    // Summaries
    let totalReservas = 0;
    let ultimas = [];

    if (db.isConfigured()) {
      const { count } = await db.reservas.countAll();
      totalReservas = count || 0;
      const { data: sincs } = await db.sincronizacoes.getLast(5);
      ultimas = sincs || [];
    } else {
      totalReservas = _memReservas.length;
      ultimas = _memSincronizacoes.slice(-5);
    }

    res.json({
      timestamp:              new Date().toISOString(),
      resumo,
      total_reservas:         totalReservas,
      persistence:            db.isConfigured() ? 'supabase' : 'in-memory',
      ultimas_sincronizacoes: ultimas,
    });
  } catch (err) {
    console.error('[status-estoque] Error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ─── Histórico de Movimentações ───────────────────────────────────────────────

app.get('/historico-movimentacoes', async (req, res) => {
  const limite = parseInt(req.query.limite, 10) || 20;

  try {
    let historico = [];
    let total = 0;

    if (db.isConfigured()) {
      const { data } = await db.movimentacoes.getLast(limite);
      historico = data || [];
      total = historico.length;
    } else {
      historico = _memMovimentacoes.slice(-limite);
      total = _memMovimentacoes.length;
    }

    res.json({ total, limite, historico });
  } catch (err) {
    console.error('[historico-movimentacoes] Error:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3003;
require('http').createServer(app).listen(PORT, () => {
  console.log(`\n📦 Squad-Estoque iniciado na porta ${PORT}`);
  console.log(`   Persistence: ${db.isConfigured() ? 'Supabase PostgreSQL' : 'In-Memory (fallback)'}`);
  console.log(`   Endpoints:`);
  console.log(`   - POST /track-inventory`);
  console.log(`   - POST /reserve-material`);
  console.log(`   - POST /manage-catalog`);
  console.log(`   - POST /alert-low-stock`);
  console.log(`   - POST /sincronizar-estoque`);
  console.log(`   - GET  /status-estoque`);
  console.log(`   - GET  /historico-movimentacoes`);
  console.log(`   - GET  /verificar-reserva\n`);
});

module.exports = app;
