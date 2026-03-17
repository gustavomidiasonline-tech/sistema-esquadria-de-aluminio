/**
 * AUTH MIDDLEWARE - JWT Bearer token validation
 * Protege rotas do Orquestrador e squads
 */

'use strict';

const { verifyJWT } = require('./auth-service');

// ─── MIDDLEWARE PRINCIPAL ─────────────────────────────────────────────────────

/**
 * Middleware de autenticação JWT.
 * Extrai o Bearer token do header Authorization, valida e injeta
 * `req.user` com o payload decodificado.
 *
 * Uso: app.use('/rota-protegida', requireAuth, handler)
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      status: 'erro',
      codigo: 'AUTH_TOKEN_AUSENTE',
      mensagem: 'Header Authorization não fornecido. Use: Authorization: Bearer <token>'
    });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      status: 'erro',
      codigo: 'AUTH_FORMAT_INVALIDO',
      mensagem: 'Formato inválido. Use: Authorization: Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    const decoded = verifyJWT(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'erro',
      codigo: 'AUTH_TOKEN_INVALIDO',
      mensagem: err.message
    });
  }
}

// ─── MIDDLEWARE DE AUTORIZAÇÃO POR ROLE ───────────────────────────────────────

/**
 * Fábrica de middleware de autorização por roles.
 * Deve ser usado APÓS requireAuth.
 *
 * @param {...string} roles - Roles permitidas (ex: 'admin', 'manager')
 * @returns {Function} Express middleware
 *
 * Uso: app.post('/admin-route', requireAuth, requireRole('admin'), handler)
 */
function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        status: 'erro',
        codigo: 'AUTH_NAO_AUTENTICADO',
        mensagem: 'Autenticação necessária'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'erro',
        codigo: 'AUTH_PERMISSAO_NEGADA',
        mensagem: `Acesso negado. Roles requeridas: ${roles.join(', ')}. Sua role: ${req.user.role}`
      });
    }

    next();
  };
}

/**
 * Middleware opcional: registra log de acesso autenticado.
 * Não bloqueia — apenas loga e segue.
 */
function logAuthAccess(req, _res, next) {
  if (req.user) {
    console.log(`[AUTH] ${new Date().toISOString()} | ${req.method} ${req.path} | user=${req.user.sub} role=${req.user.role}`);
  }
  next();
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

module.exports = {
  requireAuth,
  requireRole,
  logAuthAccess
};
