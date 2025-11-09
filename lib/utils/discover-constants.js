'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateConstantsPackage } = require('./validate-constants-package');

function readJson(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }
function sha1(str) { return crypto.createHash('sha1').update(String(str)).digest('hex'); }
const CACHE = { npm: new Map() };

function loadBuiltinConstants() {
  const constantsDir = path.join(__dirname, '..', 'constants');
  const out = {};
  try {
    const files = fs.readdirSync(constantsDir).filter((f) => f.endsWith('.js'));
    for (const f of files) {
      const mod = require(path.join(constantsDir, f));
      const domain = f.replace(/\.js$/, '');
      out[domain] = { domain, version: '1.0.0', constants: mod.constants || [], terms: { entities: [], properties: [], actions: [] }, source: 'builtin' };
    }
  } catch (err) {
    if (process.env.DEBUG_AI_CONSTANTS) {
      console.warn(`[discover-constants] failed to read builtin constants: ${err && err.message}`);
    }
  }
  return out;
}

// ===== Helpers to reduce discoverNpmPackages complexity =====
function computeCacheKey(projectRoot, pkg) {
  const depsString = JSON.stringify({ d: pkg.dependencies || {}, dv: pkg.devDependencies || {} });
  return projectRoot + ':' + sha1(depsString);
}

function isAllowedPackage(name, allowlist, patterns) {
  if (!patterns.some((p) => p.test(name))) return false;
  if (Array.isArray(allowlist) && allowlist.length) {
    for (const rule of allowlist) {
      if (!rule) continue;
      if (rule.startsWith('^')) {
        try { if (new RegExp(rule).test(name)) return true; } catch { /* ignore */ }
      } else if (rule === name) {
        return true;
      }
    }
    return false;
  }
  return true;
}

function safeSetCache(key, value) {
  try { CACHE.npm.set(key, value); } catch (e) {
    if (process.env.DEBUG_AI_CONSTANTS) console.warn(`[discover-constants] cache set failed: ${e && e.message}`);
  }
}

function safeGetCache(key) {
  try { return CACHE.npm.get(key); } catch { return undefined; }
}

function loadNpmPackage(name) {
  try {
    const mod = require(name);
    const packageMeta = mod && (mod.default || mod);
    validateConstantsPackage(packageMeta);
    return { ok: true, meta: packageMeta };
  } catch (err) {
    if (process.env.DEBUG_AI_CONSTANTS) console.warn(`[discover-constants] failed to load ${name}: ${err && err.message}`);
    return { ok: false };
  }
}

function discoverNpmPackages(projectRoot, allowlist) {
  const pkgPath = path.join(projectRoot, 'package.json');
  const pkg = readJson(pkgPath) || {};
  const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const patterns = [/^@ai-constants\//, /^eslint-constants-/, /-ai-constants$/];
  const out = {};

  let key;
  try {
    key = computeCacheKey(projectRoot, pkg);
    if (CACHE.npm.has(key) && !process.env.AI_CONSTANTS_NO_CACHE) return safeGetCache(key);
  } catch (e) {
    if (process.env.DEBUG_AI_CONSTANTS) console.warn(`[discover-constants] cache key compute failed: ${e && e.message}`);
  }

  for (const name of Object.keys(all)) {
    if (!isAllowedPackage(name, allowlist, patterns)) continue;
    const loaded = loadNpmPackage(name);
    if (loaded.ok) {
      const meta = loaded.meta;
      out[meta.domain] = { ...meta, source: 'npm', package: name };
    }
  }
  if (key) safeSetCache(key, out);
  return out;
}

function discoverLocalFiles(projectRoot) {
  const dir = path.join(projectRoot, '.ai-constants');
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.js')) continue;
    try {
      const mod = require(path.join(dir, f));
      const packageMeta = mod && (mod.default || mod);
      validateConstantsPackage(packageMeta);
      out[packageMeta.domain] = { ...packageMeta, source: 'local', file: f };
    } catch (err) {
      if (process.env.DEBUG_AI_CONSTANTS) console.warn(`[discover-constants] failed to load ${f}: ${err && err.message}`);
    }
  }
  return out;
}

function loadCustomConstants(projectRoot) {
  const p = path.join(projectRoot, '.ai-coding-guide.json');
  const cfg = readJson(p) || {};
  const custom = cfg.customConstants || {};
  const out = {};
  for (const [domain, list] of Object.entries(custom)) {
    out[domain] = { domain, version: '1.0.0', constants: list || [], source: 'custom' };
  }
  return out;
}

function discoverConstants(projectRoot = process.cwd()) {
  const cfg = readJson(path.join(projectRoot, '.ai-coding-guide.json')) || {};
  const allowlist = Array.isArray(cfg.externalConstantsAllowlist) ? cfg.externalConstantsAllowlist : [];
  return {
    builtin: loadBuiltinConstants(),
    npm: discoverNpmPackages(projectRoot, allowlist),
    local: discoverLocalFiles(projectRoot),
    custom: loadCustomConstants(projectRoot)
  };
}

module.exports = {
  discoverConstants,
  loadBuiltinConstants,
  discoverNpmPackages,
  discoverLocalFiles,
  loadCustomConstants
};
