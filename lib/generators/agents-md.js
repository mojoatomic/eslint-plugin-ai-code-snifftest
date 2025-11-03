"use strict";

const path = require('path');

function loadConstantsLib() {
  try {
    return require(path.join(__dirname, '..', 'constants'));
  } catch {
    return null;
  }
}

function formatList(title, items) {
  if (!items || !items.length) return '';
  return `### ${title}\n` + items.map((x)=>`- ${x}`).join('\n') + '\n\n';
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

function generateAgentsMd(cwd, cfg) {
  const doms = [cfg.domains.primary, ...(cfg.domains.additional||[])].filter(Boolean);
  const lib = loadConstantsLib();
  let md = `# AI Coding Rules\n\nDomains: ${doms.join(', ')}\nPriority: ${cfg.domainPriority.join(' > ')}\n\n## Naming\n- Style: ${cfg.naming.style}\n- Booleans: isX/hasX/shouldX/canX\n- Async: fetchX/loadX/saveX\n\n## Guidance\n- Use @domain/@domains annotations for ambiguous constants\n- Prefer constants/terms from active domains\n\n`;
  if (lib && lib.DOMAINS) {
    for (const d of doms) {
      const mod = lib.DOMAINS[d];
      if (!mod) continue;
      md += `## Domain: ${d}\n`;
      const meta = pickMetaForDomain(mod, 10);
      const cn = Array.isArray(mod.constants) ? mod.constants.slice(0, 10) : [];
      if (meta.length) {
        md += '\n### Constants\n```javascript\n' + meta.map(m=>`const ${m.name || ('K_'+String(m.value).replace(/[^A-Za-z0-9]+/g,'_'))} = ${m.value};${m.description ? ' // '+m.description : ''}`).join('\n') + '\n```\n\n';
      } else if (cn.length) {
        md += '\n### Constants\n```javascript\n' + cn.map(v=>`const K_${String(v).replace(/[^A-Za-z0-9]+/g,'_')} = ${v};`).join('\n') + '\n```\n\n';
      }
      const terms = Array.isArray(mod.terms) ? mod.terms.slice(0, 15) : [];
      if (terms.length) md += formatList('Terminology', terms);
    }
  }
  md += `\n## Ambiguity Tactics\n- Prefer explicit @domain/@domains on ambiguous constants\n- Use name cues (e.g., 'circleAngleDegrees')\n- Project-wide mapping via .ai-coding-guide.json → constantResolution\n\n---\n*See .ai-coding-guide.md for details*\n`;
  return md;
}

module.exports = {
  generateAgentsMd
};
