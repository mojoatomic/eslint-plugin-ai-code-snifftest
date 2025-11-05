'use strict';

const path = require('path');

function loadFingerprint(cwd) {
  const fp = path.join(cwd, '.ai-constants', 'project-fingerprint.js');
  try {
    const mod = require(fp);
    if (!mod || !Array.isArray(mod.constants)) return null;
    return mod.constants;
  } catch {
    return null;
  }
}

function applyFingerprintToConfig(cwd, cfg) {
  const items = loadFingerprint(cwd);
  if (!items || !items.length) return;
  cfg.constantResolution = cfg.constantResolution || {};
  const seenDomains = new Set(cfg.domains.additional || []);
  for (const c of items) {
    if (c && typeof c.value === 'number' && c.domain) {
      cfg.constantResolution[String(c.value)] = c.domain;
      if (c.domain !== cfg.domains.primary && !seenDomains.has(c.domain)) {
        cfg.domains.additional.push(c.domain);
        seenDomains.add(c.domain);
      }
    }
  }
}

module.exports = { loadFingerprint, applyFingerprintToConfig };
