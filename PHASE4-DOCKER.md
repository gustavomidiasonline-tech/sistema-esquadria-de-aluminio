# Phase 4 — Docker & Docker Compose

Full containerization of the ERP Aluminio & Vidracarias system.
8 specialized squads + 1 central orchestrator + PostgreSQL, all running on a shared Docker bridge network.

---

## Architecture

```
erp-network (bridge)
│
├── postgres              supabase/postgres:15.8.1.060  :5432
├── squad-producao        node:25.7.0-alpine             :3002
├── squad-estoque         node:25.7.0-alpine             :3003
├── squad-crm             node:25.7.0-alpine             :3004
├── squad-financeiro      node:25.7.0-alpine             :3005
├── squad-dashboard       node:25.7.0-alpine             :3006
├── squad-qualidade       node:25.7.0-alpine             :3007
├── squad-integradores    node:25.7.0-alpine             :3008
└── orquestrador          node:25.7.0-alpine             :4000
```

Inter-container communication uses Docker service names (e.g. `http://squad-producao:3002`). The `docker-entrypoint.js` in the orchestrator container transparently rewrites localhost URLs to the correct Docker service names at boot.

---

## Files Created

| File | Description |
|------|-------------|
| `docker-compose.yml` | Development stack — all ports exposed on host |
| `docker-compose.prod.yml` | Production overlay — resource limits, only port 4000 exposed |
| `.dockerignore` | Root-level excludes (node_modules, src, docs, etc.) |
| `squads/squad-*/Dockerfile` | Individual Dockerfile for each of the 8 squads |
| `squads/squad-*/package.json` | Standalone package.json required for npm install inside each container |
| `squads/squad-aisistema-aliminio/docker-entrypoint.js` | URL-patching wrapper for the orchestrator container |

---

## Prerequisites

- Docker Desktop 4.x or Docker Engine 24+
- Docker Compose v2 (included with Docker Desktop)
- Ports 3002-3008 and 4000 free on your host (or override via `.env`)

---

## Quick Start — Development

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env if you need to change Postgres credentials or host ports
```

### 2. Build and start all services

```bash
docker-compose up -d --build
```

### 3. Verify all services are healthy

```bash
docker-compose ps
```

All services should show `healthy` status within ~60 seconds.

### 4. Check orchestrator health

```bash
curl http://localhost:4000/health
curl http://localhost:4000/status-squads
```

---

## Common Commands

### Start all services (detached)

```bash
docker-compose up -d
```

### Start with a fresh build (after code changes)

```bash
docker-compose up -d --build
```

### Follow logs for all services

```bash
docker-compose logs -f
```

### Follow logs for a specific squad

```bash
docker-compose logs -f squad-producao
docker-compose logs -f orquestrador
docker-compose logs -f postgres
```

### Stop all services

```bash
docker-compose down
```

### Stop and remove volumes (full reset including database)

```bash
docker-compose down -v
```

### Restart a single service

```bash
docker-compose restart squad-estoque
```

### Execute a command inside a running container

```bash
docker-compose exec orquestrador sh
docker-compose exec postgres psql -U postgres -d erp_aluminio
```

### Scale a squad (if stateless)

```bash
docker-compose up -d --scale squad-qualidade=2
```

---

## Production Deployment

The `docker-compose.prod.yml` overlay:
- Sets `NODE_ENV=production`
- Removes host port bindings for all internal squads (only port 4000 of the orchestrator is exposed)
- Applies CPU and memory resource limits
- Requires `POSTGRES_USER` and `POSTGRES_PASSWORD` to be set in the environment (will fail fast otherwise)
- Uses a separate named network `erp-network-prod` and separate volumes

### Start production stack

```bash
# Set required secrets in the environment first (or use a .env file with real credentials)
export POSTGRES_USER=erp_prod
export POSTGRES_PASSWORD=<strong-password>

docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Check production health

```bash
curl http://localhost:4000/health
curl http://localhost:4000/status-squads
```

---

## Test the Full Order Flow

```bash
curl -X POST http://localhost:4000/processar-pedido \
  -H "Content-Type: application/json" \
  -d '{
    "id": "PED-2024-001",
    "cliente_id": "CLI-001",
    "cliente_nome": "Vidracaria Centro",
    "tipologia": "porta-correr-premium",
    "dimensoes": {"altura": 2100, "largura": 1500},
    "quantidade": 10,
    "material": "aluminio_6063"
  }'
```

Expected: 7-step orchestration across all squads with a final JSON result containing `"status": "sucesso"`.

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `postgres` | PostgreSQL superuser name |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL password |
| `POSTGRES_DB` | `erp_aluminio` | Database name |
| `POSTGRES_PORT` | `5432` | Host port for Postgres |
| `NODE_ENV` | `development` | Node environment |
| `PORT_PRODUCAO` | `3002` | Host port for squad-producao |
| `PORT_ESTOQUE` | `3003` | Host port for squad-estoque |
| `PORT_CRM` | `3004` | Host port for squad-crm |
| `PORT_FINANCEIRO` | `3005` | Host port for squad-financeiro |
| `PORT_DASHBOARD` | `3006` | Host port for squad-dashboard |
| `PORT_QUALIDADE` | `3007` | Host port for squad-qualidade |
| `PORT_INTEGRADORES` | `3008` | Host port for squad-integradores |
| `PORT_ORQUESTRADOR` | `4000` | Host port for the orchestrator |

---

## Troubleshooting

### Services stuck in `starting` health status

PostgreSQL takes ~30s to initialize on first run. The squads wait for `postgres` to be `healthy` before starting. The orchestrator then waits for all 7 squads to be `healthy`. Total cold-start time is approximately 60-90 seconds.

### `npm install` fails during build

Each squad's `Dockerfile` runs `npm install --production || npm install` — if `package-lock.json` is absent it falls back to a full install. This is expected for fresh builds.

### Port conflict on host

Override the conflicting port in `.env`:
```bash
PORT_CRM=13004
```
Then re-run `docker-compose up -d`.

### Orchestrator cannot reach a squad

Check the squad's health:
```bash
docker-compose ps squad-crm
docker-compose logs squad-crm
```

The `docker-entrypoint.js` logs squad URL overrides at startup — check `docker-compose logs orquestrador` to confirm the correct Docker service URLs are being used.
