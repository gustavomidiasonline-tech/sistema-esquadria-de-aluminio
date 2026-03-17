'use strict';

/**
 * pro-detector (stub)
 * This repo doesn't ship Pro modules. Provide safe fallbacks
 * so UnifiedActivationPipeline can run without optional Pro features.
 */

function isProAvailable() {
  return false;
}

function loadProModule() {
  return null;
}

module.exports = { isProAvailable, loadProModule };
