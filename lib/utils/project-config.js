'use strict';

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
antiPatterns: { forbiddenNames: [], forbiddenTerms: [] },
  experimentalExternalConstants: true,
  externalConstantsAllowlist: []
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
  if (override === null || override === undefined) return base;
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
const lastWarn = null; // { file, mtimeMs }

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

  // 1) Base from disk (cached)
  let fileMerged = DEFAULTS;
  const file = findConfig(startDir);
  if (file) {
    const st = tryStat(file);
    if (st) {
      if (cache && cache.file === file && cache.mtimeMs === st.mtimeMs) {
        fileMerged = cache.config;
      } else {
        const raw = tryRead(file);
        if (raw) {
          let parsed;
          try { parsed = JSON.parse(raw); } catch { parsed = null; }
          if (parsed && shallowValidate(parsed)) {
            // JSON Schema validation (best-effort)
            const schemaPath = path.resolve(__dirname, '..', 'config', 'ai-coding-guide.schema.json');
            ensureValidator(schemaPath);
            if (!validate || validate(parsed)) {
              fileMerged = deepMerge(DEFAULTS, parsed);
              // Derive domainPriority from file config
              try {
                const pri = Array.isArray(fileMerged.domainPriority) ? fileMerged.domainPriority.slice() : [];
                const primary = fileMerged.domains && fileMerged.domains.primary ? [fileMerged.domains.primary] : (fileMerged.domain ? [fileMerged.domain] : []);
                const additional = fileMerged.domains && Array.isArray(fileMerged.domains.additional) ? fileMerged.domains.additional : [];
                const combined = [...primary, ...additional, ...pri].filter(Boolean);
                const seen = new Set();
                fileMerged.domainPriority = combined.filter((d) => (d && !seen.has(d) && seen.add(d)));
              } catch { /* ignore derivation errors for file config */ }
              cache = { file, mtimeMs: st.mtimeMs, config: fileMerged };
            }
          }
        }
      }
    }
  }

  // 2) Overlay from env
  let envCfg = null;
  const envRaw = process.env.AI_SNIFFTEST_CONFIG_JSON;
  if (envRaw) {
    try {
      const parsedEnv = JSON.parse(envRaw);
      if (parsedEnv && typeof parsedEnv === 'object') envCfg = parsedEnv;
    } catch { /* ignore env parse */ }
  }

  // 3) Overlay from settings
  let settingsCfg = null;
  try {
    const s = context && context.settings && context.settings['ai-code-snifftest'];
    if (s && typeof s === 'object') settingsCfg = s;
  } catch { /* ignore settings extraction */ }

  // 4) Merge in precedence: disk < env < settings
  let finalCfg = fileMerged;
  if (envCfg) finalCfg = deepMerge(finalCfg, envCfg);
  if (settingsCfg) finalCfg = deepMerge(finalCfg, settingsCfg);

  // 5) Derive domainPriority again after overlays
  try {
    const pri = Array.isArray(finalCfg.domainPriority) ? finalCfg.domainPriority.slice() : [];
    const primary = finalCfg.domains && finalCfg.domains.primary ? [finalCfg.domains.primary] : (finalCfg.domain ? [finalCfg.domain] : []);
    const additional = finalCfg.domains && Array.isArray(finalCfg.domains.additional) ? finalCfg.domains.additional : [];
    const combined = [...primary, ...additional, ...pri].filter(Boolean);
    const seen = new Set();
    finalCfg.domainPriority = combined.filter((d) => (d && !seen.has(d) && seen.add(d)));
  } catch { /* ignore final derivation */ }

  return finalCfg;
}

function loadProjectConfigFile(cwd) {
  const file = path.join(cwd, '.ai-coding-guide.json');
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return { file, json: JSON.parse(raw) };
  } catch {
    return { file, json: DEFAULTS };
  }
}

function writeProjectConfigFile(file, json) {
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
}

module.exports = {
  readProjectConfig,
  DEFAULTS,
  deepMerge,
  loadProjectConfigFile,
  writeProjectConfigFile
};
