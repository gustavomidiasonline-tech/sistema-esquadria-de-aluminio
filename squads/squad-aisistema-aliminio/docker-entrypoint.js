#!/usr/bin/env node
/**
 * Docker entrypoint for the Orquestrador.
 * Patches squad URLs using environment variables before booting.
 * Used ONLY inside Docker containers — does not affect the local dev setup.
 *
 * Env vars accepted (with defaults matching docker-compose service names):
 *   SQUAD_PRODUCAO_URL    default: http://squad-producao:3002
 *   SQUAD_ESTOQUE_URL     default: http://squad-estoque:3003
 *   SQUAD_CRM_URL         default: http://squad-crm:3004
 *   SQUAD_FINANCEIRO_URL  default: http://squad-financeiro:3005
 *   SQUAD_DASHBOARD_URL   default: http://squad-dashboard:3006
 *   SQUAD_QUALIDADE_URL   default: http://squad-qualidade:3007
 *   SQUAD_INTEGRADORES_URL default: http://squad-integradores:3008
 */

const Module = require('module');
const originalRequire = Module.prototype.require;

// Intercept the orquestrador module to patch SQUADS before it runs
const SQUAD_URLS = {
  producao:    process.env.SQUAD_PRODUCAO_URL    || 'http://squad-producao:3002',
  estoque:     process.env.SQUAD_ESTOQUE_URL     || 'http://squad-estoque:3003',
  crm:         process.env.SQUAD_CRM_URL         || 'http://squad-crm:3004',
  financeiro:  process.env.SQUAD_FINANCEIRO_URL  || 'http://squad-financeiro:3005',
  dashboard:   process.env.SQUAD_DASHBOARD_URL   || 'http://squad-dashboard:3006',
  qualidade:   process.env.SQUAD_QUALIDADE_URL   || 'http://squad-qualidade:3007',
  integradores: process.env.SQUAD_INTEGRADORES_URL || 'http://squad-integradores:3008',
};

// Patch fetch globally so URLs rewritten via env work transparently
const originalFetch = global.fetch;
global.fetch = function patchedFetch(url, options) {
  let patchedUrl = url;
  for (const [key, dockerUrl] of Object.entries(SQUAD_URLS)) {
    const localUrl = `http://localhost:${new URL(dockerUrl).port}`;
    if (typeof url === 'string' && url.startsWith(localUrl)) {
      patchedUrl = url.replace(localUrl, dockerUrl);
      break;
    }
  }
  return originalFetch(patchedUrl, options);
};

console.log('[docker-entrypoint] Squad URL overrides:');
Object.entries(SQUAD_URLS).forEach(([k, v]) => console.log(`  ${k} -> ${v}`));

// Now load the actual orquestrador
require('./orquestrador.js');
