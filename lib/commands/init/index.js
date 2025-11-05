'use strict';

const fs = require('fs');
const path = require('path');

// Generators
const { writeConfig } = require(path.join(__dirname, '..', '..', 'generators', 'config-json'));
const { writeGuideMd } = require(path.join(__dirname, '..', '..', 'generators', 'guide-md'));
const { writeAgentsMd } = require(path.join(__dirname, '..', '..', 'generators', 'agents-md'));
const { writeCursorRules } = require(path.join(__dirname, '..', '..', 'generators', 'cursorrules'));
const { writeEslintConfig } = require(path.join(__dirname, '..', '..', 'generators', 'eslint-config'));

// Utilities
const { applyFingerprintToConfig } = require(path.join(__dirname, '..', '..', 'utils', 'fingerprint'));

function initCommand(cwd, args) {
  const primary = (args.primary || 'general').trim();
  const additional = (args.additional || '').split(',').map(s => s.trim()).filter(Boolean);
  const domainPriority = [primary, ...additional];
  const external = Boolean(args.external || args.experimentalExternalConstants);
  const allowlist = (args.allowlist || '').split(',').map(s=>s.trim()).filter(Boolean);
  const minimumMatch = args.minimumMatch ? parseFloat(args.minimumMatch) : 0.6;
  const minimumConfidence = args.minimumConfidence ? parseFloat(args.minimumConfidence) : 0.7;
  const cfg = {
    domains: { primary, additional },
    domainPriority,
    constants: {},
    terms: { entities: [], properties: [], actions: [] },
    naming: { style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true },
    antiPatterns: { forbiddenNames: [], forbiddenTerms: [] },
    minimumMatch,
    minimumConfidence,
    experimentalExternalConstants: external,
    externalConstantsAllowlist: allowlist
  };
  // Merge fingerprint signals into config (domains + constantResolution)
  applyFingerprintToConfig(cwd, cfg);
  if (external && (!allowlist || allowlist.length === 0)) {
    console.warn('Warning: --external used without allowlist; consider adding --allowlist to limit npm scope.');
  }
  const code = writeConfig(cwd, cfg);
  const hasWarp = fs.existsSync(path.join(cwd, 'WARP.md'));
  if (args.md || args.yes) writeGuideMd(cwd, cfg);
  if (args.cursor || args.yes) writeCursorRules(cwd, cfg);
  if (args.agents || hasWarp || args.yes || (!args.md && !args.cursor)) {
    writeAgentsMd(cwd, cfg);
    if (hasWarp) {
      console.log('Found WARP.md — preserving it; generated AGENTS.md alongside.');
    }
  }
  if (args.eslint || args.yes) writeEslintConfig(cwd, cfg);
  return code;
}

module.exports = { initCommand };
