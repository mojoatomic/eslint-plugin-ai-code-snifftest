'use strict';

const { normalizeBoolean } = require('./arch-switch');

/**
 * Decide whether external constants discovery should be enabled.
 * Rules:
 *  - Enabled by default (post-#74 flip)
 *  - --no-external disables (highest precedence)
 *  - --external=false disables
 *  - --external (or --external=true) enables (unless --no-external also present)
 */
function shouldEnableExternalConstants(args) {
  const a = args || {};
  const hasNoExternal = a['no-external'] !== undefined;
  const noExternal = normalizeBoolean(a['no-external'], false);
  if (hasNoExternal && noExternal) return false; // explicit --no-external

  if (Object.prototype.hasOwnProperty.call(a, 'external') || Object.prototype.hasOwnProperty.call(a, 'experimentalExternalConstants')) {
    const extVal = normalizeBoolean(a.external ?? a.experimentalExternalConstants, true);
    if (!extVal) return false; // --external=false
    if (extVal) return true;   // --external or --external=true
  }

  // default (flipped)
  return true;
}

module.exports = { shouldEnableExternalConstants };