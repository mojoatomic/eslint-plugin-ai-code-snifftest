'use strict';

function normalizeBoolean(val, defaultValue) {
  if (val === undefined || val === null) return defaultValue;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'on' || s === 'yes' || s === 'y') return true;
    if (s === 'false' || s === '0' || s === 'off' || s === 'no' || s === 'n') return false;
  }
  return defaultValue;
}

/**
 * Decide whether architecture guardrails should be enabled.
 * Rules:
 *  - Enabled by default
 *  - --no-arch disables (highest precedence)
 *  - --arch=false disables
 *  - --arch (or --arch=true) enables (unless --no-arch also present)
 */
function shouldEnableArchitecture(args) {
  const a = args || {};
  const hasNoArch = a['no-arch'] !== undefined;
  const noArch = normalizeBoolean(a['no-arch'], false);
  if (hasNoArch && noArch) return false; // explicit --no-arch

  if (Object.prototype.hasOwnProperty.call(a, 'arch')) {
    const archVal = normalizeBoolean(a.arch, true);
    if (!archVal) return false; // --arch=false
    if (archVal) return true;   // --arch or --arch=true
  }

  // default
  return true;
}

module.exports = { shouldEnableArchitecture, normalizeBoolean };