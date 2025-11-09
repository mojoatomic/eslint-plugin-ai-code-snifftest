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

function getStartDir(context) {
  const filename = typeof context.getFilename === 'function' ? context.getFilename() : '';
  return filename ? path.dirname(filename) : (typeof context.getCwd === 'function' ? context.getCwd() : process.cwd());
}

function deriveDomainPriorityInPlace(cfg) {
  try {
    const pri = Array.isArray(cfg.domainPriority) ? cfg.domainPriority.slice() : [];
    const primary = cfg.domains && cfg.domains.primary ? [cfg.domains.primary] : (cfg.domain ? [cfg.domain] : []);
    const additional = cfg.domains && Array.isArray(cfg.domains.additional) ? cfg.domains.additional : [];
    const combined = [...primary, ...additional, ...pri].filter(Boolean);
    const seen = new Set();
    cfg.domainPriority = combined.filter((d) => (d && !seen.has(d) && seen.add(d)));
  } catch {
    // ignore derivation errors
  }
}

function loadConfigFromDisk(startDir) {
  let fileMerged = DEFAULTS;
  const file = findConfig(startDir);
  if (file) {
    const st = tryStat(file);
    if (st) {
      if (cache && cache.file === file && cache.mtimeMs === st.mtimeMs) {
        return cache.config;
      }
      const raw = tryRead(file);
      if (raw) {
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = null; }
        if (parsed && shallowValidate(parsed)) {
          const schemaPath = path.resolve(__dirname, '..', 'config', 'ai-coding-guide.schema.json');
          ensureValidator(schemaPath);
          if (!validate || validate(parsed)) {
            fileMerged = deepMerge(DEFAULTS, parsed);
            deriveDomainPriorityInPlace(fileMerged);
            cache = { file, mtimeMs: st.mtimeMs, config: fileMerged };
          }
        }
      }
    }
  }
  return fileMerged;
}

function readEnvConfig() {
  const envRaw = process.env.AI_SNIFFTEST_CONFIG_JSON;
  if (!envRaw) return null;
  try {
    const parsedEnv = JSON.parse(envRaw);
    return parsedEnv && typeof parsedEnv === 'object' ? parsedEnv : null;
  } catch {
    return null;
  }
}

function readSettingsConfig(context) {
  try {
    const s = context && context.settings && context.settings['ai-code-snifftest'];
    return s && typeof s === 'object' ? s : null;
  } catch {
    return null;
  }
}

function mergeConfigs(base, envCfg, settingsCfg) {
  let out = base;
  if (envCfg) out = deepMerge(out, envCfg);
  if (settingsCfg) out = deepMerge(out, settingsCfg);
  return out;
}

function readProjectConfig(context) {
  const startDir = getStartDir(context);
  const fileCfg = loadConfigFromDisk(startDir);
  const envCfg = readEnvConfig();
  const settingsCfg = readSettingsConfig(context);

  const finalCfg = mergeConfigs(fileCfg, envCfg, settingsCfg);
  deriveDomainPriorityInPlace(finalCfg);
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
