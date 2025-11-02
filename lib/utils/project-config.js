"use strict";

const fs = require('fs');
const path = require('path');

const DEFAULTS = Object.freeze({
  domain: 'general',
  version: '1.0',
  constants: {},
  terms: { entities: [], properties: [], actions: [] },
  naming: { style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true },
  antiPatterns: { forbiddenNames: [], forbiddenTerms: [] }
});

let cache = null; // { file, mtimeMs, config }

function tryStat(p) { try { return fs.statSync(p); } catch { return null; } }
function tryRead(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

function shallowValidate(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (obj.constants && typeof obj.constants !== 'object') return false;
  if (obj.terms && typeof obj.terms !== 'object') return false;
  if (obj.naming && typeof obj.naming !== 'object') return false;
  if (obj.antiPatterns && typeof obj.antiPatterns !== 'object') return false;
  return true;
}

function deepMerge(base, override) {
  if (override == null) return base;
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      out[k] = deepMerge(base[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function findConfig(startDir) {
  let dir = startDir;
  for (let i = 0; i < 20; i++) {
    const candidate = path.join(dir, '.ai-coding-guide.json');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function readProjectConfig(context) {
  const filename = typeof context.getFilename === 'function' ? context.getFilename() : '';
  const startDir = filename ? path.dirname(filename) : (typeof context.getCwd === 'function' ? context.getCwd() : process.cwd());

  const file = findConfig(startDir);
  if (!file) return DEFAULTS;

  const st = tryStat(file);
  if (!st) return DEFAULTS;

  if (cache && cache.file === file && cache.mtimeMs === st.mtimeMs) {
    return cache.config;
  }

  const raw = tryRead(file);
  if (!raw) return DEFAULTS;

  let parsed;
  try { parsed = JSON.parse(raw); } catch { return DEFAULTS; }
  if (!shallowValidate(parsed)) return DEFAULTS;

  const merged = deepMerge(DEFAULTS, parsed);
  cache = { file, mtimeMs: st.mtimeMs, config: merged };
  return merged;
}

module.exports = {
  readProjectConfig,
  DEFAULTS
};