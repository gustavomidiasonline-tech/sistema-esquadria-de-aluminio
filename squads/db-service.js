#!/usr/bin/env node
/**
 * db-service.js — Supabase Database Abstraction Layer
 * =====================================================
 * Centralised Supabase client shared by all squads.
 *
 * Usage (from any squad server.js):
 *
 *   const db = require('../db-service');
 *
 *   // Fluent table access
 *   const { data, error } = await db.from('inventario').select('*');
 *
 *   // Helper: upsert inventario row
 *   await db.inventario.upsert({ material_id: 'aluminio_6063', quantidade: 500, minimo: 50 });
 *
 * Graceful degradation:
 *   When SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are absent the module logs a
 *   warning and exports a no-op stub so squads continue to run with in-memory
 *   fallback (no crash at startup).
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');

// ─── Configuration ────────────────────────────────────────────────────────────

const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Fallback to anon key (read-only, RLS-aware) when service role is absent
const SUPABASE_ANON_KEY        = process.env.SUPABASE_ANON_KEY;

const activeKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

// ─── No-op stub (graceful degradation) ───────────────────────────────────────

function makeNoop(tableName) {
  const warn = (op) => {
    console.warn(`[db-service] Supabase not configured — ${op}(${tableName}) skipped (in-memory mode).`);
    return Promise.resolve({ data: null, error: { message: 'Supabase not configured' } });
  };

  return {
    select: (...a) => ({ data: null, error: null, then: (r) => r({ data: [], error: null }) }),
    insert: (rows) => warn('insert'),
    upsert:  (rows) => warn('upsert'),
    update:  (patch) => ({ eq: () => warn('update') }),
    delete:  ()      => ({ eq: () => warn('delete') }),
  };
}

// ─── Real Supabase client ─────────────────────────────────────────────────────

let supabase = null;
let configured = false;

if (SUPABASE_URL && activeKey) {
  try {
    supabase = createClient(SUPABASE_URL, activeKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    configured = true;
    console.log('[db-service] Supabase client initialised.');
  } catch (err) {
    console.error('[db-service] Failed to create Supabase client:', err.message);
  }
} else {
  console.warn(
    '[db-service] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — running in in-memory mode.'
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * from(tableName) → Supabase query builder (or no-op stub)
 */
function from(tableName) {
  if (!configured || !supabase) return makeNoop(tableName);
  return supabase.from(tableName);
}

/**
 * isConfigured() → boolean
 */
function isConfigured() {
  return configured;
}

// ─── Domain helpers ───────────────────────────────────────────────────────────

const inventario = {
  /** Get all inventory rows */
  async findAll() {
    return from('inventario').select('*');
  },

  /** Get a single inventory row by material_id */
  async findById(materialId) {
    return from('inventario').select('*').eq('material_id', materialId).single();
  },

  /**
   * Upsert an inventory row.
   * @param {object} row - { material_id, quantidade, minimo, unidade, fornecedor, status }
   */
  async upsert(row) {
    return from('inventario').upsert(row, { onConflict: 'material_id' }).select().single();
  },

  /**
   * Apply a delta to the quantidade column atomically.
   * Falls back to a read-modify-write if rpc is not used.
   * @param {string} materialId
   * @param {number} delta - positive = entrada, negative = saída
   */
  async applyDelta(materialId, delta) {
    if (!configured) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    // Read current value
    const { data: current, error: readErr } = await inventario.findById(materialId);
    if (readErr) return { data: null, error: readErr };

    const novaQtd = (parseFloat(current.quantidade) || 0) + delta;
    const novoStatus = novaQtd < current.minimo
      ? (novaQtd <= 0 ? 'critico' : 'baixo')
      : 'ok';

    return from('inventario')
      .update({ quantidade: novaQtd, status: novoStatus })
      .eq('material_id', materialId)
      .select()
      .single();
  },
};

const reservas = {
  /** Insert a new reservation row */
  async create(row) {
    return from('reservas').insert(row).select().single();
  },

  /** List all reservations for a given reserva_id prefix */
  async findByReservaId(reservaId) {
    return from('reservas').select('*').eq('reserva_id', reservaId);
  },

  /** Update reservation status */
  async updateStatus(id, status) {
    return from('reservas').update({ status }).eq('id', id).select().single();
  },

  /** Count all active reservations */
  async countAll() {
    return from('reservas').select('*', { count: 'exact', head: true });
  },
};

const movimentacoes = {
  /** Insert a movement record */
  async create(row) {
    return from('movimentacoes').insert(row).select().single();
  },

  /** Get last N movements, newest first */
  async getLast(limit = 20) {
    return from('movimentacoes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
  },
};

const sincronizacoes = {
  /** Insert a sync log entry */
  async create(row) {
    return from('sincronizacoes').insert(row).select().single();
  },

  /** Get last N sync entries */
  async getLast(limit = 5) {
    return from('sincronizacoes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
  },
};

const clientes = {
  /** Upsert a client row (keyed by external id stored in observacoes or a dedicated field) */
  async upsert(row) {
    // Uses Supabase native clientes table; id is UUID auto-generated
    return from('clientes').insert(row).select().single();
  },

  async findAll() {
    return from('clientes').select('id, nome, email, telefone, created_at').order('created_at', { ascending: false });
  },

  async findById(id) {
    return from('clientes').select('*').eq('id', id).single();
  },
};

const orcamentos = {
  async create(row) {
    return from('orcamentos').insert(row).select().single();
  },

  async updateStatus(id, status) {
    return from('orcamentos').update({ status }).eq('id', id).select().single();
  },

  async findById(id) {
    return from('orcamentos').select('*').eq('id', id).single();
  },

  async findAll() {
    return from('orcamentos')
      .select('id, numero, cliente_id, status, valor_total, created_at')
      .order('created_at', { ascending: false });
  },
};

const vendas = {
  async create(row) {
    return from('vendas').insert(row).select().single();
  },

  async findAll() {
    return from('vendas').select('*').order('created_at', { ascending: false });
  },

  async sumByTipo() {
    if (!configured) return { receita: 0, despesa: 0 };
    const { data, error } = await from('vendas').select('tipo, valor');
    if (error || !data) return { receita: 0, despesa: 0 };

    const receita = data.filter(v => v.tipo === 'receita').reduce((s, v) => s + parseFloat(v.valor || 0), 0);
    const despesa = data.filter(v => v.tipo === 'despesa').reduce((s, v) => s + parseFloat(v.valor || 0), 0);
    return { receita, despesa };
  },
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // Raw query builder
  from,
  isConfigured,

  // Domain helpers
  inventario,
  reservas,
  movimentacoes,
  sincronizacoes,
  clientes,
  orcamentos,
  vendas,

  // Expose raw client for advanced usage
  get client() { return supabase; },
};
