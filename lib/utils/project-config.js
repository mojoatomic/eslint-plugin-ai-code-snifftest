"use strict";

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const DEFAULTS = Object.freeze({
  domain: 'general',
  domains: { primary: 'general', additional: [] },
  domainPriority: [],
  constantResolution: {},
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

let ajv = null;
let validate = null;
let lastWarn = null; // { file, mtimeMs }

function ensureValidator(schemaPath) {
  if (!ajv) ajv = new Ajv({ allErrors: true, strict: false });
  if (!validate) {
    try {
      const schema = require(schemaPath);
      validate = ajv.compile(schema);
    } catch {
      validate = null;
    }
  }
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

  // JSON Schema validation (best-effort)
  const schemaPath = path.resolve(__dirname, '..', 'config', 'ai-coding-guide.schema.json');
  ensureValidator(schemaPath);
  if (validate && !validate(parsed)) {
    if (!lastWarn || lastWarn.file !== file || lastWarn.mtimeMs !== st.mtimeMs) {
      const msg = (validate.errors || []).map(e => `${e.instancePath || '(root)'} ${e.message}`).join('; ');
       
      console.warn(`[ai-code-snifftest] Invalid .ai-coding-guide.json at ${file}: ${msg}`);
      lastWarn = { file, mtimeMs: st.mtimeMs };
    }
    return DEFAULTS;
  }

  const merged = deepMerge(DEFAULTS, parsed);
  // Derive domainPriority if not provided
  try {
    const pri = Array.isArray(merged.domainPriority) ? merged.domainPriority.slice() : [];
    const primary = merged.domains && merged.domains.primary ? [merged.domains.primary] : (merged.domain ? [merged.domain] : []);
    const additional = merged.domains && Array.isArray(merged.domains.additional) ? merged.domains.additional : [];
    const combined = [...primary, ...additional, ...pri].filter(Boolean);
    const seen = new Set();
    merged.domainPriority = combined.filter((d) => (d && !seen.has(d) && seen.add(d)));
} catch {
    // ignore derivation errors
  }
  cache = { file, mtimeMs: st.mtimeMs, config: merged };
  return merged;
}

module.exports = {
  readProjectConfig,
  DEFAULTS
};