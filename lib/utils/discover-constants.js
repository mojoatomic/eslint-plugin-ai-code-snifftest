"use strict";

const fs = require('fs');
const path = require('path');
const { validateConstantsPackage } = require('./validate-constants-package');

function readJson(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }

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

function discoverNpmPackages(projectRoot) {
  const pkg = readJson(path.join(projectRoot, 'package.json')) || {};
  const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const patterns = [/^@ai-constants\//, /^eslint-constants-/, /-ai-constants$/];
  const out = {};
  for (const name of Object.keys(all)) {
    if (!patterns.some((p) => p.test(name))) continue;
    try {
      const mod = require(name);
      const data = mod && (mod.default || mod);
      validateConstantsPackage(data);
      out[data.domain] = { ...data, source: 'npm', package: name };
    } catch (err) {
      // skip invalid packages but log in debug
      if (process.env.DEBUG_AI_CONSTANTS) {
         
        console.warn(`[discover-constants] failed to load ${name}: ${err && err.message}`);
      }
    }
  }
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
      const data = mod && (mod.default || mod);
      validateConstantsPackage(data);
      out[data.domain] = { ...data, source: 'local', file: f };
    } catch (err) {
      if (process.env.DEBUG_AI_CONSTANTS) {
         
        console.warn(`[discover-constants] failed to load ${f}: ${err && err.message}`);
      }
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
  return {
    builtin: loadBuiltinConstants(),
    npm: discoverNpmPackages(projectRoot),
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