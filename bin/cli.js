#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  // simple parse; supports flags like --foo or --foo=bar
  const out = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=');
      out[k] = v === undefined ? true : v;
    } else {
      out._.push(a);
    }
  }
  return out;
}

function loadConstantsLib() {
  try {
    return require(path.join(__dirname, '../lib/constants'));
  } catch {
    return null;
  }
}

function pickMetaForDomain(mod, max) {
  const items = [];
  if (Array.isArray(mod.constantMeta)) {
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
      // attach metadata under a non-breaking field
      const meta = pickMetaForDomain(mod, 50);
      if (meta.length) {
        out._constantMeta = out._constantMeta || {};
        out._constantMeta[d] = meta;
      }
    }
  }
  // sensible defaults for constantResolution
  out.constantResolution = out.constantResolution || {};
  if (selected.includes('geometry')) out.constantResolution['360'] = 'geometry';
  if (selected.includes('astronomy')) out.constantResolution['365.25'] = 'astronomy';
  if (selected.includes('math')) out.constantResolution['3.14159'] = 'math';
  return out;
}

function writeConfig(cwd, cfg) {
  const file = path.join(cwd, '.ai-coding-guide.json');
  if (fs.existsSync(file) && !process.env.FORCE_AI_CONFIG) {
    console.log(`Found existing ${file} — use FORCE_AI_CONFIG=1 to overwrite.`);
    return 0;
  }
  const enriched = enrichConfigWithDomains(cfg);
  fs.writeFileSync(file, JSON.stringify(enriched, null, 2) + '\n');
  console.log(`Wrote ${file}`);
  return 0;
}

function suggestFor(primary) {
  const map = {
    astronomy: ['geometry','math','units'],
    music: ['math','cs'],
    physics: ['math','units','cs'],
    finance: ['math','statistics']
  };
  return map[primary] || [];
}

function ask(rl, q) {
  return new Promise((resolve) => rl.question(q, (ans) => resolve(ans)));
}

async function initInteractive(cwd) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const primary = (await ask(rl, 'Primary domain (default: general): ')).trim() || 'general';
    const suggested = suggestFor(primary);
    if (suggested.length) {
      console.log(`Suggested additional domains for ${primary}: ${suggested.join(', ')}`);
    }
    const addAns = (await ask(rl, 'Additional domains (comma-separated, optional): ')).trim();
    const additional = addAns ? addAns.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const domainPriority = [primary, ...additional];
    console.log(`\nSummary:\n  primary: ${primary}\n  additional: ${additional.join(', ') || '(none)'}\n  domainPriority: ${domainPriority.join(', ')}`);
    const confirm = (await ask(rl, 'Write .ai-coding-guide.json with these settings? (Y/n): ')).trim().toLowerCase();
    if (confirm && confirm.startsWith('n')) {
      console.log('Aborted.');
      return 1;
    }
    const cfg = {
      domains: { primary, additional },
      domainPriority,
      constants: {},
      terms: { entities: [], properties: [], actions: [] },
      naming: { style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true },
      antiPatterns: { forbiddenNames: [], forbiddenTerms: [] }
    };
    const code = writeConfig(cwd, cfg);
    const gen = (await ask(rl, 'Generate .ai-coding-guide.md and .cursorrules? (Y/n): ')).trim().toLowerCase();
    if (!gen || gen.startsWith('y')) {
      writeGuideMd(cwd, cfg);
      writeCursorRules(cwd, cfg);
    }
    const hasWarp = fs.existsSync(path.join(cwd, 'WARP.md'));
    console.log(hasWarp ? 'Detected WARP.md — will not modify it.' : 'No WARP.md detected.');
    const agents = (await ask(rl, 'Generate AGENTS.md (recommended)? (Y/n): ')).trim().toLowerCase();
    if (!agents || agents.startsWith('y')) {
      writeAgentsMd(cwd, cfg);
    }
    const genEslint = (await ask(rl, 'Generate eslint.config.js (Y/n): ')).trim().toLowerCase();
    if (!genEslint || genEslint.startsWith('y')) {
      writeEslintConfig(cwd);
    }
    return code;
  } finally {
    rl.close();
  }
}

function formatList(title, items) {
  if (!items || !items.length) return '';
  return `### ${title}\n` + items.map((x)=>`- ${x}`).join('\n') + '\n\n';
}

function writeGuideMd(cwd, cfg) {
  const file = path.join(cwd, '.ai-coding-guide.md');
  const doms = [cfg.domains.primary, ...(cfg.domains.additional||[])].filter(Boolean);
  const lib = loadConstantsLib();
  let md = `# AI Coding Guide\n\nPrimary domain: ${cfg.domains.primary}\nAdditional domains: ${cfg.domains.additional.join(', ') || '(none)'}\nDomain priority: ${cfg.domainPriority.join(', ')}\n\n`;
  md += `## Guidance\n- Use @domain/@domains annotations for ambiguous constants\n- Prefer constants and terms from active domains\n\n`;
  if (lib && lib.DOMAINS) {
    for (const d of doms) {
      const mod = lib.DOMAINS[d];
      if (!mod) continue;
      md += `## Domain: ${d}\n\n`;
      const meta = pickMetaForDomain(mod, 20);
      const cn = Array.isArray(mod.constants) ? mod.constants.slice(0, 20) : [];
      const terms = Array.isArray(mod.terms) ? mod.terms.slice(0, 20) : [];
      if (meta.length) {
        md += '### Constants\n\n```javascript\n' + meta.map(m=>`const ${m.name || ('C_'+String(m.value).replace(/[^A-Za-z0-9]+/g,'_'))} = ${m.value};${m.description ? ' // '+m.description : ''}`).join('\n') + '\n```\n\n';
      } else if (cn.length) {
        md += '### Constants\n\n```javascript\n' + cn.map(v=>`const C_${String(v).replace(/[^A-Za-z0-9]+/g,'_')} = ${v};`).join('\n') + '\n```\n\n';
      }
      md += formatList('Terminology', terms);
    }
  }
  md += `\n### Examples\n\n✅ const isOrbiting = true;\n✅ const orbitalPeriodDays = 365.25;\n❌ const data = calculate(); // too generic\n`;
  // Append ambiguity guidance and precedence
  md += `\n## Ambiguity and Disambiguation\nWhen a numeric literal could belong to multiple domains (e.g., 360 geometry vs 360 astronomy), disambiguate:\n\n1) Inline annotation\n\n\`\`\`js\n// @domain geometry\nconst fullCircle = 720 / 2; // 360°\n\`\`\`\n\n2) Name-based cue\n\n\`\`\`js\nconst circleAngleDegrees = 720 / 2;\n\`\`\`\n\n3) Config override (project-wide)\n\n\`\`\`json\n{\n  \"constantResolution\": {\n    \"360\": \"geometry\"\n  }\n}\n\`\`\`\n\n## Active-Domain Precedence\nWhen multiple domains match, the linter prefers the first in domainPriority. Adjust this order to shape suggestions.\n\nExample:\n\n\`\`\`json\n{\n  \"domains\": { \"primary\": \"${cfg.domains.primary}\", \"additional\": [${cfg.domains.additional.map(d=>`\"${d}\"`).join(', ')}] },\n  \"domainPriority\": [${cfg.domainPriority.map(d=>`\"${d}\"`).join(', ')}]\n}\n\`\`\`\n`;
  fs.writeFileSync(file, md);
  console.log(`Wrote ${file}`);
}

function writeAgentsMd(cwd, cfg) {
  const file = path.join(cwd, 'AGENTS.md');
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
  // Ambiguity tactics
  md += `\n## Ambiguity Tactics\n- Prefer explicit @domain/@domains on ambiguous constants\n- Use name cues (e.g., 'circleAngleDegrees')\n- Project-wide mapping via .ai-coding-guide.json → constantResolution\n\n---\n*See .ai-coding-guide.md for details*\n`;
  fs.writeFileSync(file, md);
  console.log(`Wrote ${file}`);
}
}

function writeCursorRules(cwd, cfg) {
  const file = path.join(cwd, '.cursorrules');
  const payload = {
    rules: [
      `Primary domain: ${cfg.domains.primary}`,
      `Additional domains: ${cfg.domains.additional.join(', ')}`,
      'Prefer explicit @domain annotations for ambiguous constants.',
      'Use UPPER_SNAKE_CASE for true constants; camelCase for variables.',
      'Boolean vars must be prefixed: is/has/should/can/did/will.'
    ]
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n');
  console.log(`Wrote ${file}`);
}

function writeEslintConfig(cwd) {
  const file = path.join(cwd, 'eslint.config.js');
  if (fs.existsSync(file) && !process.env.FORCE_ESLINT_CONFIG) {
    console.log(`Found existing ${file} — set FORCE_ESLINT_CONFIG=1 to overwrite.`);
    return;
  }
  const content = `// Generated by eslint-plugin-ai-code-snifftest init\nimport js from '@eslint/js';\nimport aiSnifftest from 'eslint-plugin-ai-code-snifftest';\n\nexport default [\n  js.configs.recommended,\n  {\n    files: ['**/*.js'],\n    plugins: { 'ai-code-snifftest': aiSnifftest },\n    rules: {\n      // Baseline\n      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],\n      'no-undef': 'error',\n      'prefer-const': 'warn',\n      'no-var': 'error',\n      // Consistency\n      'quotes': ['warn', 'single', { avoidEscape: true }],\n      'semi': ['warn', 'always'],\n      'eqeqeq': ['error', 'always'],\n      // AI-friendly\n      'complexity': ['warn', 15],\n      'max-depth': ['warn', 4],\n      'max-lines-per-function': ['warn', 100],\n      // Naming (basic)\n      'camelcase': ['error', { properties: 'always' }],\n      // Domain-specific\n      'ai-code-snifftest/no-redundant-calculations': 'warn',\n      'ai-code-snifftest/no-equivalent-branches': 'warn',\n      'ai-code-snifftest/prefer-simpler-logic': 'warn',\n      'ai-code-snifftest/no-redundant-conditionals': 'warn',\n      'ai-code-snifftest/no-unnecessary-abstraction': 'warn',\n      'ai-code-snifftest/no-generic-names': 'warn',\n      'ai-code-snifftest/enforce-domain-terms': 'warn'\n    }\n  },\n  {\n    files: ['**/*.test.js', '**/*.spec.js'],\n    rules: { 'max-lines-per-function': 'off', 'complexity': 'off' }\n  }\n];\n`;
  fs.writeFileSync(file, content);
  console.log(`Wrote ${file}`);
}

function init(cwd, args) {
  const primary = (args.primary || 'general').trim();
  const additional = (args.additional || '').split(',').map(s => s.trim()).filter(Boolean);
  const domainPriority = [primary, ...additional];
  const cfg = {
    domains: { primary, additional },
    domainPriority,
    constants: {},
    terms: { entities: [], properties: [], actions: [] },
    naming: { style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true },
    antiPatterns: { forbiddenNames: [], forbiddenTerms: [] }
  };
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
  if (args.eslint || args.yes) writeEslintConfig(cwd);
  return code;
}

function usage() {
  console.log(`Usage: eslint-plugin-ai-code-snifftest init [--primary=<domain>] [--additional=a,b,c]

Examples:
  eslint-plugin-ai-code-snifftest init --primary=astronomy --additional=geometry,math,units
`);
}

function resolvePkgVersion(name, cwd) {
  try {
    const pkg = require(require.resolve(`${name}/package.json`, { paths: [cwd] }));
    return pkg.version || null;
  } catch {
    return null;
  }
}

function gte(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return true;
}

function checkRequirements(cwd) {
  let ok = true;
  const nodeVer = process.versions.node;
  if (!gte(nodeVer, '18.0.0')) {
    console.error(`❌ Node.js 18+ required. You have ${nodeVer}. Install Node 18+ (recommended 20+).`);
    ok = false;
  } else {
    console.log(`✅ Node.js ${nodeVer}`);
  }
  const eslintVer = resolvePkgVersion('eslint', cwd);
  if (!eslintVer || !gte(eslintVer, '9.0.0')) {
    console.error(`❌ ESLint 9+ required. Your project: ${eslintVer || 'not installed'}.`);
    console.error(`   Upgrade: npm install eslint@^9.0.0`);
    ok = false;
  } else {
    console.log(`✅ ESLint ${eslintVer}`);
  }
  const reactVer = resolvePkgVersion('react', cwd);
  if (reactVer && !gte(reactVer, '18.0.0')) {
    console.warn(`⚠️ React 18+ recommended. Detected ${reactVer}.`);
  }
  const vueVer = resolvePkgVersion('vue', cwd);
  if (vueVer && !gte(vueVer, '3.0.0')) {
    console.warn(`⚠️ Vue 3+ recommended. Detected ${vueVer}.`);
  }
  const nextVer = resolvePkgVersion('next', cwd);
  if (nextVer && !gte(nextVer, '13.0.0')) {
    console.warn(`⚠️ Next.js 13+ recommended. Detected ${nextVer}.`);
  }
  return ok;
}

function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
  const cwd = process.cwd();
  if (cmd === 'init') {
    if (!checkRequirements(process.cwd())) { process.exitCode = 1; return; }
    if (!args.primary && process.stdin.isTTY) {
      initInteractive(cwd).then((code)=>{ process.exitCode = code; });
      return;
    }
    process.exitCode = init(cwd, args);
    return;
  }
  usage();
}

main();