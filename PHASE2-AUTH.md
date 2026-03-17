# Phase 2 — Autenticação OAuth2/JWT

Sistema ERP Alumínio & Vidraçarias
Orquestrador Central — Porta 4000

---

## Arquitetura

```
Cliente (curl / frontend)
        │
        │  POST /auth/login  →  recebe access_token + refresh_token
        │
        ▼
┌─────────────────────────────────────────────────┐
│          ORQUESTRADOR  :4000                    │
│                                                 │
│  /auth/*     ──► auth-router.js  (público)      │
│  requireAuth ──► auth-middleware.js             │
│                      │                         │
│                      ▼                         │
│              auth-service.js                   │
│              (JWT + bcrypt)                    │
│                                                 │
│  /processar-pedido  ──► [requireAuth] ──► squads│
│  /status-squads     ──► [requireAuth] ──► squads│
│  /status/:id        ──► [requireAuth]           │
└─────────────────────────────────────────────────┘
```

### Padrão OAuth2 Resource Server

O sistema segue o **Resource Server pattern** do OAuth2 (RFC 6750):
- Tokens são **Bearer tokens JWT** assinados com HMAC-SHA256
- Access token tem TTL curto (1h por padrão)
- Refresh token tem TTL longo (7d) e pode ser revogado
- Senhas armazenadas como **hash bcrypt** (rounds=10)

---

## Arquivos Criados

| Arquivo | Localização | Descrição |
|---------|-------------|-----------|
| `auth-service.js` | `squads/squad-aisistema-aliminio/` | Funções JWT + bcrypt |
| `auth-middleware.js` | `squads/squad-aisistema-aliminio/` | Express middleware de proteção |
| `auth-router.js` | `squads/squad-aisistema-aliminio/` | Endpoints `/auth/*` |
| `orquestrador.js` | `squads/squad-aisistema-aliminio/` | Atualizado com auth |
| `20260317200000_create_users_auth.sql` | `supabase/migrations/` | Tabela `users` + RLS |

---

## Dependências Instaladas

```bash
npm install jsonwebtoken bcryptjs --save
```

---

## Variáveis de Ambiente

```bash
# Segredos JWT (OBRIGATÓRIO mudar em produção)
JWT_SECRET=pixel-perfect-erp-secret-2026-change-in-production
JWT_REFRESH_SECRET=pixel-perfect-erp-refresh-secret-2026-change-in-production

# TTLs (opcional — defaults abaixo)
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# bcrypt rounds (opcional — default 10)
BCRYPT_ROUNDS=10
```

---

## Endpoints de Autenticação

### POST /auth/register

Cria novo usuário. Roles `admin`/`manager` exigem Bearer token de admin.

```bash
# Registrar usuário operador (sem autenticação)
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operador@empresa.com",
    "password": "Senha@2026!",
    "role": "operator",
    "nome": "Operador de Producao"
  }'
```

Resposta (201):
```json
{
  "status": "sucesso",
  "mensagem": "Usuário registrado com sucesso",
  "usuario": {
    "id": "usr-1742244000000-abc123",
    "email": "operador@empresa.com",
    "role": "operator",
    "nome": "Operador de Producao",
    "created_at": "2026-03-17T20:00:00.000Z"
  }
}
```

```bash
# Registrar usuário admin (requer token de admin)
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "email": "gerente@empresa.com",
    "password": "Gerente@2026!",
    "role": "manager",
    "nome": "Gerente de Producao"
  }'
```

---

### POST /auth/login

Autentica com email/senha. Retorna access token (1h) e refresh token (7d).

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pixel-perfect.local",
    "password": "Admin@2026!"
  }'
```

Resposta (200):
```json
{
  "status": "sucesso",
  "token_type": "Bearer",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": "1h",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_expires_in": "7d",
  "usuario": {
    "id": "00000000-0000-0000-0000-000000000001",
    "email": "admin@pixel-perfect.local",
    "role": "admin",
    "nome": "Administrador do Sistema",
    "created_at": "2026-03-17T20:00:00.000Z"
  }
}
```

---

### POST /auth/refresh

Renova o access token usando um refresh token válido (sem exigir nova senha).

```bash
curl -X POST http://localhost:4000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

Resposta (200):
```json
{
  "status": "sucesso",
  "token_type": "Bearer",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": "1h"
}
```

---

### POST /auth/logout

Revoga o refresh token. Requer access token válido.

```bash
curl -X POST http://localhost:4000/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }'
```

Resposta (200):
```json
{
  "status": "sucesso",
  "mensagem": "Logout realizado com sucesso. Refresh token revogado."
}
```

---

### GET /auth/me

Retorna dados do usuário autenticado (token introspection).

```bash
curl http://localhost:4000/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Resposta (200):
```json
{
  "status": "sucesso",
  "usuario": {
    "id": "00000000-0000-0000-0000-000000000001",
    "role": "admin",
    "email": "admin@pixel-perfect.local",
    "token_expires_at": "2026-03-17T21:00:00.000Z"
  }
}
```

---

## Endpoints Protegidos — Uso com Bearer Token

### Fluxo Completo (script de exemplo)

```bash
#!/bin/bash
# 1. Login e captura do token
RESPONSE=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pixel-perfect.local","password":"Admin@2026!"}')

ACCESS_TOKEN=$(echo $RESPONSE | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).access_token")
REFRESH_TOKEN=$(echo $RESPONSE | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).refresh_token")

echo "Token obtido: ${ACCESS_TOKEN:0:50}..."

# 2. Verificar status dos squads (protegido)
curl -s http://localhost:4000/status-squads \
  -H "Authorization: Bearer $ACCESS_TOKEN" | python3 -m json.tool

# 3. Processar pedido (protegido)
curl -X POST http://localhost:4000/processar-pedido \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "id": "PED-2026-001",
    "cliente_id": "CLI-001",
    "cliente_nome": "Vidracaria Centro",
    "tipologia": "porta-correr-premium",
    "dimensoes": {"altura": 2100, "largura": 1500},
    "quantidade": 10,
    "material": "aluminio_6063"
  }'

# 4. Renovar token antes de expirar
NEW_ACCESS=$(curl -s -X POST http://localhost:4000/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}" | \
  node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).access_token")

echo "Token renovado: ${NEW_ACCESS:0:50}..."

# 5. Logout
curl -X POST http://localhost:4000/auth/logout \
  -H "Authorization: Bearer $NEW_ACCESS" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}"
```

### Sem token — resposta de erro esperada

```bash
curl http://localhost:4000/status-squads
```

```json
{
  "status": "erro",
  "codigo": "AUTH_TOKEN_AUSENTE",
  "mensagem": "Header Authorization não fornecido. Use: Authorization: Bearer <token>"
}
```

---

## Schema Supabase — Tabela `users`

```sql
CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,           -- bcrypt hash rounds=10
  role          user_role   NOT NULL DEFAULT 'operator',
  nome          TEXT,
  ativo         BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);
```

**Roles disponíveis:** `admin` > `manager` > `operator` > `viewer`

**RLS:** A tabela tem Row Level Security ativo. O backend usa `service_role` key para acesso completo; usuários autenticados via Supabase Auth só leem o próprio registro.

---

## Roles e Permissões

| Role | /auth/* | /processar-pedido | /status-squads | /status/:id |
|------|---------|-------------------|----------------|-------------|
| admin | sim | sim | sim | sim |
| manager | sim | sim | sim | sim |
| operator | sim (register limitado) | sim | sim | sim |
| viewer | sim (login/me) | nao (403) | sim | sim |

> Nota: Para granularidade de role no `/processar-pedido`, use `requireRole('admin','manager','operator')` no middleware.

---

## Segurança — Checklist de Produção

- [ ] Rotacionar `JWT_SECRET` e `JWT_REFRESH_SECRET` para valores aleatórios de 32+ bytes
- [ ] Configurar HTTPS (TLS) — tokens em plain HTTP sao vulneraveis a MITM
- [ ] Trocar token store in-memory por Redis (revoked tokens persistidos)
- [ ] Conectar `usersStore` ao Supabase via service key (substituir Map por queries)
- [ ] Implementar rate limiting no `/auth/login` (proteção contra brute force)
- [ ] Adicionar `last_login_at` update no banco a cada login bem-sucedido
- [ ] Aumentar `BCRYPT_ROUNDS` para 12 em produção (mais lento = mais seguro)
- [ ] Remover usuario seed `admin@pixel-perfect.local` ou trocar senha

---

## Estrutura de um JWT Decodificado

```json
{
  "sub": "00000000-0000-0000-0000-000000000001",
  "role": "admin",
  "email": "admin@pixel-perfect.local",
  "iat": 1742244000,
  "exp": 1742247600,
  "iss": "pixel-perfect-erp"
}
```
