# 🚀 QUICK START - Pixel Perfect Pixels ERP

## 1️⃣ Prerequisites

- Docker & Docker Compose installed
- Node.js 25.7.0 (for local development)
- Port 4000 available (orchestrator)
- Ports 3002-3008 available (squads)

## 2️⃣ First Time Setup

### Step 1: Configure Environment
```bash
# Already done! .env is configured for local development
# If using Supabase:
cp .env .env.local
# Then edit .env with your Supabase credentials:
#   SUPABASE_URL=https://your-project.supabase.co
#   SUPABASE_ANON_KEY=your-key
#   SUPABASE_SERVICE_KEY=your-service-key
```

### Step 2: Build Docker Images
```bash
docker-compose build
```

### Step 3: Start Services
```bash
# Development mode (all ports exposed)
docker-compose up -d

# Watch logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Step 4: Verify System
```bash
# Health check
curl http://localhost:4000/health

# Check all squads
curl http://localhost:4000/status-squads

# Should return:
# {
#   "total_online": 7,
#   "total": 7,
#   "squads": { "producao": "online", ... }
# }
```

## 3️⃣ Authentication Flow

### Register New User
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@pixel.local",
    "password": "SecurePass@123",
    "nome": "Test User",
    "role": "operator"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@pixel.local",
    "password": "SecurePass@123"
  }'

# Response includes:
# { "access_token": "eyJ...", "refresh_token": "eyJ..." }
```

### Use Protected Endpoint
```bash
curl -X POST http://localhost:4000/processar-pedido \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "PED-2026-001",
    "cliente_id": "CLI-001",
    "cliente_nome": "Vidraçaria Centro",
    "tipologia": "porta-correr-premium",
    "dimensoes": {"altura": 2100, "largura": 1500},
    "quantidade": 10,
    "material": "aluminio_6063"
  }'
```

## 4️⃣ Common Commands

```bash
# Stop services
docker-compose down

# Rebuild after code changes
docker-compose build && docker-compose up -d

# View specific service logs
docker-compose logs squad-estoque

# Execute command in container
docker-compose exec squad-producao node -v

# Remove volumes (WARNING: data loss)
docker-compose down -v
```

## 5️⃣ Production Deployment

```bash
# Set production environment
export POSTGRES_PASSWORD=<your-secure-password>

# Start with production config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Only port 4000 is exposed to host
# Resource limits are active (CPU, Memory)
# Strict env validation enabled
```

## 📊 System Status

Access these endpoints to monitor:

- **Health**: `GET http://localhost:4000/health`
- **Squad Status**: `GET http://localhost:4000/status-squads` (requires auth)
- **User Info**: `GET http://localhost:4000/auth/me` (requires auth)

## 🛠️ Troubleshooting

### Containers not starting
```bash
docker-compose logs
# Check for port conflicts or missing .env variables
```

### Authentication fails
```bash
# Verify JWT_SECRET is set in .env
# Check if /auth/register was successful
# Use curl -v for detailed response
```

### Supabase connection issues
```bash
# Check SUPABASE_URL and keys in .env
# Verify network connectivity
# Falls back to in-memory if not configured (no error)
```

## 📚 Documentation

- `PHASE2-DATABASE.md` - Database schema and persistence layer
- `PHASE2-AUTH.md` - Authentication flows and security
- `PHASE4-DOCKER.md` - Docker configuration details
- `EXECUTION-REPORT.md` - Original system implementation

---

**Status**: ✅ Ready for production deployment
**Last Updated**: 2026-03-17
