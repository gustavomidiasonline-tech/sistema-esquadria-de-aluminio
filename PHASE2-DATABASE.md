# PHASE 2 — Supabase Persistence Layer

## Overview

This document describes the database persistence layer implemented for the
Aluminium ERP squad microservices. The system migrates from volatile in-memory
storage (Maps and Arrays) to a durable Supabase PostgreSQL backend while
preserving complete backwards compatibility through graceful degradation.

---

## Architecture

```
squads/
├── db-service.js               ← Shared Supabase abstraction (NEW)
├── .env.example                ← Squad-level env vars template (NEW)
├── squad-estoque/
│   └── server.js               ← Updated: Supabase + in-memory fallback
├── squad-crm/
│   └── server.js               ← Updated: Supabase + in-memory fallback
└── squad-financeiro/
    └── server.js               ← Updated: Supabase + in-memory fallback

supabase/
└── migrations/
    └── 20260317200000_squads_persistence_layer.sql   ← NEW migration
```

### Dependency Graph

```
squad-estoque/server.js  ──┐
squad-crm/server.js      ──┤──► db-service.js ──► @supabase/supabase-js ──► Supabase Cloud
squad-financeiro/server.js ┘
```

---

## New Database Tables

All tables are created in the `public` schema with RLS enabled.

### `inventario`

Stores current stock levels for each material.

| Column       | Type           | Description                              |
|--------------|----------------|------------------------------------------|
| id           | UUID PK        | Auto-generated                           |
| material_id  | TEXT UNIQUE    | Business key (e.g. `aluminio_6063`)      |
| quantidade   | NUMERIC(12,4)  | Current stock quantity                   |
| minimo       | NUMERIC(12,4)  | Reorder threshold                        |
| unidade      | TEXT           | Unit of measure (`m²`, `unidades`, etc.) |
| fornecedor   | TEXT           | Supplier name                            |
| status       | TEXT CHECK     | `ok`, `baixo`, `critico`                 |
| created_at   | TIMESTAMPTZ    | Auto-set on insert                       |
| updated_at   | TIMESTAMPTZ    | Auto-updated via trigger                 |

Seed data: `aluminio_6063` (500 m²) and `vidro_temperado` (300 units) are
inserted on migration with `ON CONFLICT DO NOTHING`.

### `reservas`

Tracks material reservations per production plan.

| Column       | Type           | Description                              |
|--------------|----------------|------------------------------------------|
| id           | UUID PK        | Auto-generated                           |
| reserva_id   | TEXT           | External reservation reference           |
| material_id  | TEXT FK        | References `inventario(material_id)`     |
| quantidade   | NUMERIC(12,4)  | Reserved quantity                        |
| status       | TEXT CHECK     | `ativa`, `liberada`, `cancelada`         |
| created_at   | TIMESTAMPTZ    | Auto-set                                 |
| updated_at   | TIMESTAMPTZ    | Auto-updated via trigger                 |

### `movimentacoes`

Immutable audit log of every stock movement.

| Column              | Type          | Description                          |
|---------------------|---------------|--------------------------------------|
| id                  | UUID PK       | Auto-generated                       |
| material_id         | TEXT          | Material reference                   |
| tipo                | TEXT CHECK    | `entrada`, `saida`, `reabastecimento`, `ajuste` |
| quantidade          | NUMERIC(12,4) | Absolute movement amount             |
| quantidade_anterior | NUMERIC(12,4) | Stock level before movement          |
| quantidade_nova     | NUMERIC(12,4) | Stock level after movement           |
| fornecedor          | TEXT          | Supplier (for reabastecimento)       |
| observacao          | TEXT          | Free-text note                       |
| created_at          | TIMESTAMPTZ   | Auto-set (immutable row)             |

### `sincronizacoes`

Log of supplier synchronisation runs.

| Column                   | Type        | Description                        |
|--------------------------|-------------|------------------------------------|
| id                       | UUID PK     | Auto-generated                     |
| sinc_id                  | TEXT UNIQUE | `SINC-{timestamp}`                 |
| materiais_verificados    | INTEGER     | Number of materials checked        |
| materiais_reabastecidos  | INTEGER     | Number of materials restocked      |
| status                   | TEXT        | Sync status                        |
| created_at               | TIMESTAMPTZ | Auto-set                           |

### `vendas`

Financial transactions (income / expense) linked optionally to pedidos.

| Column     | Type          | Description                          |
|------------|---------------|--------------------------------------|
| id         | UUID PK       | Auto-generated                       |
| pedido_id  | UUID FK NULL  | References `pedidos(id)`             |
| tipo       | TEXT CHECK    | `receita` or `despesa`               |
| valor      | NUMERIC(12,2) | Transaction amount (BRL)             |
| descricao  | TEXT          | Free-text description                |
| created_by | UUID FK NULL  | References `auth.users(id)`          |
| created_at | TIMESTAMPTZ   | Auto-set                             |

---

## `db-service.js` — Abstraction Layer

Location: `/squads/db-service.js`

### Initialisation

The module reads environment variables at startup:

```
SUPABASE_URL             — Project URL (required)
SUPABASE_SERVICE_ROLE_KEY — Bypasses RLS (preferred for server-side)
SUPABASE_ANON_KEY        — Fallback when service role is absent
```

When either URL or key is missing the module prints a warning and exports a
no-op stub. All squads continue to start and operate with their in-memory
state — zero crashes.

### Public API

```js
const db = require('../db-service');

// Check if Supabase is available
db.isConfigured()   // → boolean

// Raw query builder (returns Supabase QueryBuilder or no-op stub)
db.from('inventario').select('*')

// Domain helpers
db.inventario.findAll()
db.inventario.findById(materialId)
db.inventario.upsert(row)
db.inventario.applyDelta(materialId, delta)   // atomic read-modify-write

db.reservas.create(row)
db.reservas.findByReservaId(reservaId)
db.reservas.updateStatus(id, status)
db.reservas.countAll()

db.movimentacoes.create(row)
db.movimentacoes.getLast(limit)

db.sincronizacoes.create(row)
db.sincronizacoes.getLast(limit)

db.clientes.upsert(row)
db.clientes.findAll()
db.clientes.findById(id)

db.orcamentos.create(row)
db.orcamentos.updateStatus(id, status)
db.orcamentos.findById(id)
db.orcamentos.findAll()

db.vendas.create(row)
db.vendas.findAll()
db.vendas.sumByTipo()   // → { receita: number, despesa: number }

// Raw Supabase client (advanced use)
db.client   // SupabaseClient | null
```

---

## Squad Changes

### squad-estoque (port 3003)

- All endpoints (`/track-inventory`, `/reserve-material`, `/alert-low-stock`,
  `/sincronizar-estoque`, `/status-estoque`, `/historico-movimentacoes`,
  `/verificar-reserva`) now persist to and read from Supabase tables
  `inventario`, `reservas`, `movimentacoes`, `sincronizacoes`.
- `applyDelta` performs a read-modify-write for atomic quantity updates.
- In-memory Maps/Arrays preserved as fallback under `_mem*` variables.
- `/health` response now includes `"persistence": "supabase" | "in-memory"`.

### squad-crm (port 3004)

- `/manage-clients` — inserts to `public.clientes`; stores external
  `cliente_id` in the `observacoes` JSON field for backwards compatibility.
- `/generate-quote` — resolves Supabase client UUID by matching `observacoes`,
  then inserts to `public.orcamentos`.
- `/track-sales` — updates `orcamentos.status` via UUID.
- `/clientes` (NEW GET) — lists all clients from Supabase or in-memory.
- `/orcamentos` (NEW GET) — lists all quotes from Supabase or in-memory.

### squad-financeiro (port 3005)

- `/process-invoice` — persists each NF-e as a `receita` row in `public.vendas`.
- `/manage-finances` — inserts movement to `public.vendas`, reads aggregated
  totals via `db.vendas.sumByTipo()`.
- `/generate-reports` — reads live DRE figures from `public.vendas`.

---

## Migration

File: `supabase/migrations/20260317200000_squads_persistence_layer.sql`

Apply with Supabase CLI:

```bash
supabase db push
```

Or apply manually against your Supabase project SQL editor.

### What the migration does

1. Creates tables: `inventario`, `reservas`, `movimentacoes`, `sincronizacoes`, `vendas`
2. Enables RLS on all tables
3. Adds permissive `authenticated` read/write policies
4. Attaches `update_updated_at_column()` triggers to mutable tables
5. Creates B-tree indexes on common filter columns
6. Seeds `inventario` with two initial materials (idempotent via `ON CONFLICT DO NOTHING`)

---

## Environment Setup

1. Copy `squads/.env.example` to `squads/.env` (or set variables in the shell).
2. Fill `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Run `npm install` from the project root (adds `@supabase/supabase-js`).
4. Apply the migration: `supabase db push`.
5. Start squads normally: `npm start` or individual `npm run start:estoque`, etc.

Without steps 1-4 the squads start in in-memory mode — all existing flows
continue to work unchanged.

---

## Graceful Degradation Design

```
Supabase available?
      │
      ├─ YES → persist to PostgreSQL, return real data
      │
      └─ NO  → log warning at startup, use _mem* variables
               All endpoints respond normally.
               No error thrown. No crash.
```

This ensures zero-downtime development: developers without Supabase credentials
can run the full squad system locally without any configuration.

---

## Files Created / Modified

| File | Action |
|------|--------|
| `squads/db-service.js` | CREATED — Supabase abstraction layer |
| `squads/.env.example` | CREATED — Squad env vars template |
| `squads/squad-estoque/server.js` | UPDATED — Supabase + fallback |
| `squads/squad-crm/server.js` | UPDATED — Supabase + fallback |
| `squads/squad-financeiro/server.js` | UPDATED — Supabase + fallback |
| `supabase/migrations/20260317200000_squads_persistence_layer.sql` | CREATED — DB migration |
| `package.json` | UPDATED — added `@supabase/supabase-js` dependency |
