/**
 * AUTH ROUTER - Endpoints de autenticação OAuth2/JWT
 *
 * Monta:
 *   POST /auth/register  - Cadastro de novo usuário
 *   POST /auth/login     - Login com email/senha → tokens JWT
 *   POST /auth/refresh   - Renovação de access token via refresh token
 *   POST /auth/logout    - Revogação do refresh token
 */

'use strict';

const express = require('express');
const router = express.Router();

const {
  generateJWT,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  hashPassword,
  validatePassword,
  VALID_ROLES
} = require('./auth-service');

const { requireAuth } = require('./auth-middleware');

// ─── STORE DE USUÁRIOS (in-memory) ───────────────────────────────────────────
// Em produção substitua por consultas ao Supabase via service key.
// A migration `20260317200000_create_users_auth.sql` cria a tabela no banco.

/** @type {Map<string, { id: string, email: string, password_hash: string, role: string, nome: string, created_at: string, ativo: boolean }>} */
const usersStore = new Map();

// Seed do usuário admin padrão (mesma senha do migration seed: Admin@2026!)
// O hash abaixo é gerado via bcrypt com rounds=10 para 'Admin@2026!'
(async () => {
  const { hashPassword: hp } = require('./auth-service');
  const defaultHash = await hp('Admin@2026!');
  if (!usersStore.has('admin@pixel-perfect.local')) {
    usersStore.set('admin@pixel-perfect.local', {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@pixel-perfect.local',
      password_hash: defaultHash,
      role: 'admin',
      nome: 'Administrador do Sistema',
      created_at: new Date().toISOString(),
      ativo: true
    });
    console.log('[AUTH] Usuário admin padrão inicializado: admin@pixel-perfect.local / Admin@2026!');
  }
})();

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Retorna dados públicos do usuário (sem hash de senha). */
function publicUser(u) {
  return { id: u.id, email: u.email, role: u.role, nome: u.nome, created_at: u.created_at };
}

// ─── POST /auth/register ─────────────────────────────────────────────────────

/**
 * Registra um novo usuário.
 *
 * Body: { email, password, role?, nome? }
 *
 * Regras:
 * - email único
 * - senha mínima 8 caracteres
 * - role padrão: 'operator'
 * - Apenas 'admin' pode criar contas com role 'admin' ou 'manager'
 *   (requere token de admin no header; se não houver header, cria como 'operator')
 */
router.post('/register', async (req, res) => {
  const { email, password, role = 'operator', nome = '' } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      status: 'erro',
      codigo: 'REGISTER_CAMPOS_OBRIGATORIOS',
      mensagem: 'email e password são obrigatórios'
    });
  }

  // Normaliza email
  const emailNorm = email.trim().toLowerCase();

  if (usersStore.has(emailNorm)) {
    return res.status(409).json({
      status: 'erro',
      codigo: 'REGISTER_EMAIL_DUPLICADO',
      mensagem: 'Este email já está cadastrado'
    });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      status: 'erro',
      codigo: 'REGISTER_ROLE_INVALIDA',
      mensagem: `Role inválida. Válidas: ${VALID_ROLES.join(', ')}`
    });
  }

  // Roles elevadas exigem autenticação de admin
  if (['admin', 'manager'].includes(role)) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(403).json({
        status: 'erro',
        codigo: 'REGISTER_PERMISSAO_NEGADA',
        mensagem: 'Criar usuário com role admin/manager requer autenticação de admin'
      });
    }
    try {
      const { verifyJWT: v } = require('./auth-service');
      const decoded = v(authHeader.replace(/^[Bb]earer\s+/, ''));
      if (decoded.role !== 'admin') {
        return res.status(403).json({
          status: 'erro',
          codigo: 'REGISTER_PERMISSAO_NEGADA',
          mensagem: 'Apenas admin pode criar usuários com role elevada'
        });
      }
    } catch {
      return res.status(401).json({
        status: 'erro',
        codigo: 'AUTH_TOKEN_INVALIDO',
        mensagem: 'Token de administrador inválido ou expirado'
      });
    }
  }

  try {
    const password_hash = await hashPassword(password);
    const id = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const created_at = new Date().toISOString();

    const user = { id, email: emailNorm, password_hash, role, nome: nome.trim(), created_at, ativo: true };
    usersStore.set(emailNorm, user);

    console.log(`[AUTH] Novo usuário registrado: ${emailNorm} (role=${role})`);

    return res.status(201).json({
      status: 'sucesso',
      mensagem: 'Usuário registrado com sucesso',
      usuario: publicUser(user)
    });

  } catch (err) {
    console.error('[AUTH] Erro ao registrar usuário:', err.message);
    return res.status(400).json({
      status: 'erro',
      codigo: 'REGISTER_ERRO',
      mensagem: err.message
    });
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

/**
 * Autentica usuário com email/senha.
 * Retorna access token (1h) e refresh token (7d).
 *
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      status: 'erro',
      codigo: 'LOGIN_CAMPOS_OBRIGATORIOS',
      mensagem: 'email e password são obrigatórios'
    });
  }

  const emailNorm = email.trim().toLowerCase();
  const user = usersStore.get(emailNorm);

  if (!user) {
    // Retorna mensagem genérica para não vazar info de existência
    return res.status(401).json({
      status: 'erro',
      codigo: 'LOGIN_CREDENCIAIS_INVALIDAS',
      mensagem: 'Email ou senha incorretos'
    });
  }

  if (!user.ativo) {
    return res.status(403).json({
      status: 'erro',
      codigo: 'LOGIN_CONTA_INATIVA',
      mensagem: 'Conta desativada. Entre em contato com o administrador'
    });
  }

  const senhaCorreta = await validatePassword(password, user.password_hash);
  if (!senhaCorreta) {
    return res.status(401).json({
      status: 'erro',
      codigo: 'LOGIN_CREDENCIAIS_INVALIDAS',
      mensagem: 'Email ou senha incorretos'
    });
  }

  const { accessToken, expiresIn } = generateJWT(user.id, user.role, { email: user.email });
  const { refreshToken, expiresIn: refreshExpiresIn } = generateRefreshToken(user.id, user.role);

  console.log(`[AUTH] Login bem-sucedido: ${emailNorm} (role=${user.role})`);

  return res.status(200).json({
    status: 'sucesso',
    token_type: 'Bearer',
    access_token: accessToken,
    expires_in: expiresIn,
    refresh_token: refreshToken,
    refresh_expires_in: refreshExpiresIn,
    usuario: publicUser(user)
  });
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────

/**
 * Renova o access token usando um refresh token válido.
 *
 * Body: { refresh_token }
 */
router.post('/refresh', (req, res) => {
  const { refresh_token } = req.body || {};

  if (!refresh_token) {
    return res.status(400).json({
      status: 'erro',
      codigo: 'REFRESH_TOKEN_AUSENTE',
      mensagem: 'refresh_token é obrigatório no body'
    });
  }

  try {
    const decoded = verifyRefreshToken(refresh_token);

    const { accessToken, expiresIn } = generateJWT(decoded.sub, decoded.role);

    console.log(`[AUTH] Token renovado para user=${decoded.sub} role=${decoded.role}`);

    return res.status(200).json({
      status: 'sucesso',
      token_type: 'Bearer',
      access_token: accessToken,
      expires_in: expiresIn
    });

  } catch (err) {
    return res.status(401).json({
      status: 'erro',
      codigo: 'REFRESH_TOKEN_INVALIDO',
      mensagem: err.message
    });
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

/**
 * Revoga o refresh token (logout).
 * Requer access token válido para confirmar identidade.
 *
 * Body: { refresh_token }
 * Header: Authorization: Bearer <access_token>
 */
router.post('/logout', requireAuth, (req, res) => {
  const { refresh_token } = req.body || {};

  if (refresh_token) {
    revokeRefreshToken(refresh_token);
  }

  console.log(`[AUTH] Logout realizado: user=${req.user.sub}`);

  return res.status(200).json({
    status: 'sucesso',
    mensagem: 'Logout realizado com sucesso. Refresh token revogado.'
  });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

/**
 * Retorna dados do usuário autenticado (token introspection).
 * Header: Authorization: Bearer <access_token>
 */
router.get('/me', requireAuth, (req, res) => {
  return res.status(200).json({
    status: 'sucesso',
    usuario: {
      id: req.user.sub,
      role: req.user.role,
      email: req.user.email,
      token_expires_at: new Date(req.user.exp * 1000).toISOString()
    }
  });
});

module.exports = router;
