"use strict";

const path = require('path');

function loadConstantsLib() {
  try {
    return require(path.join(__dirname, '..', 'constants'));
  } catch {
    return null;
  }
}

function generateCodingGuideMd(cwd, cfg) {
  let md = `# AI Coding Guide\n\nPrimary domain: ${cfg.domains.primary}\nAdditional domains: ${cfg.domains.additional.join(', ') || '(none)'}\nDomain priority: ${cfg.domainPriority.join(', ')}\n\nGuidance:\n- Use domain annotations (@domain/@domains) for ambiguous constants\n- Prefer constants and terms from active domains\n`;

  const lib = loadConstantsLib();
  const DOMAINS = lib && lib.DOMAINS;
  if (DOMAINS) {
    const sections = [];
    for (const d of cfg.domainPriority) {
      const mod = DOMAINS[d];
      const constants = Array.isArray(mod && mod.constants) ? mod.constants : [];
      const terms = Array.isArray(mod && mod.terms) ? mod.terms : [];
      const sources = Array.isArray(mod && mod.sources) ? mod.sources : [];
      sections.push(`## Domain: ${d}\n\n- Sources: ${sources.length ? sources.join(', ') : 'internal'}\n- Constants (${constants.length}): ${constants.map(v => String(v)).join(', ') || '(none)'}\n- Terminology (${terms.length}): ${terms.join(', ') || '(none)'}\n`);
    }
    if (sections.length) md += `\n${sections.join('\n')}`;
  }

  if (cfg.experimentalExternalConstants) {
    try {
      const { discoverConstants } = require(path.join(__dirname, '..', 'utils', 'discover-constants'));
      const { mergeConstants } = require(path.join(__dirname, '..', 'utils', 'merge-constants'));
      const discovered = discoverConstants(cwd);
      const merged = mergeConstants(discovered);
      const counts = {
        builtin: Object.keys(discovered.builtin || {}).length,
        npm: Object.keys(discovered.npm || {}).length,
        local: Object.keys(discovered.local || {}).length,
        custom: Object.keys(discovered.custom || {}).length,
      };
      const domains = Object.keys(merged || {});
      md += `\n## External Constants Discovery (experimental)\nBuilt-in: ${counts.builtin}  NPM: ${counts.npm}  Local: ${counts.local}  Custom: ${counts.custom}\nDomains: ${domains.join(', ') || '(none)'}\n`;
    } catch (err) {
      md += `\n## External Constants Discovery (experimental)\nError: ${err && err.message}\n`;
    }
  }

md += `\n## Ambiguity and Disambiguation\nWhen a numeric literal could belong to multiple domains (e.g., 360 geometry vs 360 astronomy), disambiguate:\n\n1) Inline annotation\n\n~~~js\n// @domain geometry\nconst fullCircle = 720 / 2; // 360°\n~~~\n\n2) Name-based cue\n\n~~~js\nconst circleAngleDegrees = 720 / 2;\n~~~\n\n3) Config override (project-wide)\n\n~~~json\n{\n  "constantResolution": {\n    "360": "geometry"\n  }\n}\n~~~\n\n## Active-Domain Precedence\nWhen multiple domains match, the linter prefers the first in domainPriority. Adjust this order to shape suggestions.\n\nExample:\n\n~~~json\n{\n  "domains": { "primary": "${cfg.domains.primary}", "additional": [${cfg.domains.additional.map(d=> '"' + d + '"').join(', ')}] },\n  "domainPriority": [${cfg.domainPriority.map(d=> '"' + d + '"').join(', ')}]\n}\n~~~\n`;

  return md;
}

module.exports = {
  generateCodingGuideMd
};
