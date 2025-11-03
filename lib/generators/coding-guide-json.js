"use strict";

const path = require('path');

function loadConstantsLib() {
  try {
    return require(path.join(__dirname, '..', 'constants'));
  } catch {
    return null;
  }
}

function pickMetaForDomain(mod, max) {
  const items = [];
  if (Array.isArray(mod && mod.constantMeta)) {
    for (const m of mod.constantMeta) {
      if (m && (typeof m.value === 'number' || typeof m.value === 'string')) {
        items.push({ value: m.value, name: m.name, description: m.description });
      }
      if (items.length >= max) break;
    }
  }
  return items;
}

function enrichConfigWithDomains(cfg) {
  const lib = loadConstantsLib();
  if (!lib || !lib.DOMAINS) return cfg;
  const out = JSON.parse(JSON.stringify(cfg));
  out.constants = out.constants || {};
  const selected = [out.domains.primary, ...(out.domains.additional || [])].filter(Boolean);
  for (const d of selected) {
    const mod = lib.DOMAINS[d];
    if (mod) {
      if (Array.isArray(mod.constants) && mod.constants.length) {
        out.constants[d] = Array.from(new Set(mod.constants)).slice(0, 50);
      }
      const meta = pickMetaForDomain(mod, 50);
      if (meta.length) {
        out._constantMeta = out._constantMeta || {};
        out._constantMeta[d] = meta;
      }
    }
  }
  out.constantResolution = out.constantResolution || {};
  if (selected.includes('geometry')) out.constantResolution['360'] = 'geometry';
  if (selected.includes('astronomy')) out.constantResolution['365.25'] = 'astronomy';
  if (selected.includes('math')) out.constantResolution['3.14159'] = 'math';
  return out;
}

function generateCodingGuideJson(cwd, cfg) {
  // cwd not used yet, reserved for future external merges
  const enriched = enrichConfigWithDomains(cfg);
  return JSON.stringify(enriched, null, 2) + '\n';
}

module.exports = {
  generateCodingGuideJson
};
