/**
 * AUTH SERVICE - JWT + Password utilities
 * Centraliza geração/verificação de tokens e hashing de senhas
 */

'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'pixel-perfect-erp-secret-2026-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'pixel-perfect-erp-refresh-secret-2026-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

// Roles válidas no sistema
const VALID_ROLES = ['admin', 'manager', 'operator', 'viewer'];

// ─── TOKEN STORE (in-memory — troque por Redis em produção) ──────────────────

/** @type {Set<string>} tokens de refresh revogados */
const revokedTokens = new Set();

// ─── FUNÇÕES PÚBLICAS ─────────────────────────────────────────────────────────

/**
 * Gera um access token JWT para o usuário.
 *
 * @param {string} userId  - UUID ou ID do usuário
 * @param {string} role    - Papel do usuário (admin | manager | operator | viewer)
 * @param {object} [extra] - Dados extras opcionais incluídos no payload
 * @returns {{ accessToken: string, expiresIn: string }}
 */
function generateJWT(userId, role, extra = {}) {
  if (!userId) throw new Error('userId é obrigatório para gerar JWT');
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Role inválida: '${role}'. Válidas: ${VALID_ROLES.join(', ')}`);
  }

  const payload = {
    sub: String(userId),
    role,
    iat: Math.floor(Date.now() / 1000),
    ...extra
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'pixel-perfect-erp'
  });

  return { accessToken, expiresIn: JWT_EXPIRES_IN };
}

/**
 * Gera um refresh token de longa duração para o usuário.
 *
 * @param {string} userId
 * @param {string} role
 * @returns {{ refreshToken: string, expiresIn: string }}
 */
function generateRefreshToken(userId, role) {
  if (!userId) throw new Error('userId é obrigatório para gerar refresh token');

  const payload = {
    sub: String(userId),
    role,
    type: 'refresh'
  };

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'pixel-perfect-erp'
  });

  return { refreshToken, expiresIn: JWT_REFRESH_EXPIRES_IN };
}

/**
 * Verifica e decodifica um access token JWT.
 *
 * @param {string} token
 * @returns {{ sub: string, role: string, iat: number, exp: number, [key: string]: any }}
 * @throws {Error} se o token for inválido, expirado ou revogado
 */
function verifyJWT(token) {
  if (!token) throw new Error('Token não fornecido');

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'pixel-perfect-erp'
    });
    return decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expirado. Faça login novamente ou use /auth/refresh');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new Error('Token inválido ou malformado');
    }
    throw new Error(`Erro ao verificar token: ${err.message}`);
  }
}

/**
 * Verifica um refresh token e retorna o payload decodificado.
 *
 * @param {string} token
 * @returns {{ sub: string, role: string, type: string }}
 * @throws {Error} se inválido, expirado ou já revogado
 */
function verifyRefreshToken(token) {
  if (!token) throw new Error('Refresh token não fornecido');

  if (revokedTokens.has(token)) {
    throw new Error('Refresh token revogado. Faça login novamente');
  }

  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'pixel-perfect-erp'
    });

    if (decoded.type !== 'refresh') {
      throw new Error('Token não é um refresh token válido');
    }

    return decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Refresh token expirado. Faça login novamente');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new Error('Refresh token inválido ou malformado');
    }
    throw err;
  }
}

/**
 * Revoga um refresh token (logout).
 *
 * @param {string} token
 */
function revokeRefreshToken(token) {
  if (token) revokedTokens.add(token);
}

/**
 * Gera o hash bcrypt de uma senha em texto plano.
 *
 * @param {string} password - Senha em texto plano
 * @returns {Promise<string>} Hash bcrypt
 */
async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Senha inválida para hash');
  }
  if (password.length < 8) {
    throw new Error('Senha deve ter no mínimo 8 caracteres');
  }

  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Valida uma senha em texto plano contra um hash bcrypt.
 *
 * @param {string} password - Senha em texto plano
 * @param {string} hash     - Hash armazenado
 * @returns {Promise<boolean>}
 */
async function validatePassword(password, hash) {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

module.exports = {
  generateJWT,
  generateRefreshToken,
  verifyJWT,
  verifyRefreshToken,
  revokeRefreshToken,
  hashPassword,
  validatePassword,
  VALID_ROLES
};
