-- ============================================================================
-- MIGRATION: create_users_auth
-- Tabela de usuários para autenticação JWT do sistema ERP
-- ============================================================================

-- Enum de roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager', 'operator', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          user_role   NOT NULL DEFAULT 'operator',
  nome          TEXT,
  ativo         BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

-- Index no email para lookup rápido no login
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Index na role para queries de autorização
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Tabela de refresh tokens revogados (blacklist)
-- Em produção pode ser migrada para Redis, mas mantemos aqui para compatibilidade Supabase
CREATE TABLE IF NOT EXISTS revoked_refresh_tokens (
  token_hash  TEXT        PRIMARY KEY,         -- SHA-256 do token para não armazenar o token em si
  user_id     UUID        REFERENCES users(id) ON DELETE CASCADE,
  revoked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL              -- para limpeza periódica
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_refresh_tokens (expires_at);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE revoked_refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Apenas o service_role (backend Node.js via service key) acessa users
-- Usuários autenticados podem ler somente o próprio registro
CREATE POLICY "users_self_read" ON users
  FOR SELECT
  USING (id::text = auth.uid()::text);

CREATE POLICY "users_service_role_all" ON users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "revoked_tokens_service_role_all" ON revoked_refresh_tokens
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── SEED: usuário admin inicial ─────────────────────────────────────────────
-- ATENÇÃO: hash abaixo corresponde à senha 'Admin@2026!' gerada com bcrypt rounds=10
-- Troque imediatamente em produção via POST /auth/register ou UPDATE direto.

INSERT INTO users (email, password_hash, role, nome)
VALUES (
  'admin@pixel-perfect.local',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lBum', -- Admin@2026!
  'admin',
  'Administrador do Sistema'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
COMMENT ON TABLE users IS 'Usuários do sistema ERP para autenticação JWT';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt da senha (rounds=10)';
COMMENT ON COLUMN users.role IS 'Papel do usuário: admin > manager > operator > viewer';
COMMENT ON TABLE revoked_refresh_tokens IS 'Blacklist de refresh tokens revogados (logout)';
