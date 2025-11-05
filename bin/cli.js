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

async function initInteractive(cwd, args) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    let primary = (await ask(rl, 'Primary domain (default: general): ')).trim() || 'general';
    const suggested = suggestFor(primary);
    if (suggested.length) {
      console.log(`Suggested additional domains for ${primary}: ${suggested.join(', ')}`);
    }
    // Show domain metadata via wizard helper
    try {
      const { buildDomainMetadata } = require(path.join(__dirname, '..', 'lib', 'wizard', 'domain-selector'));
      const metas = buildDomainMetadata();
      if (Array.isArray(metas) && metas.length) {
        console.log('\nDiscovered domains:');
        for (const m of metas) {
          const src = m.sources && m.sources.length ? m.sources.join(', ') : 'internal';
          console.log(`  - ${m.name} (constants: ${m.constantsCount}, terms: ${m.termsCount}, sources: ${src})`);
        }
        const sel = metas.find(d => d.name === primary);
        if (sel && sel.constantsCount === 0) {
          console.warn(`⚠️ Warning: selected primary '${primary}' has zero discovered constants.`);
        }
      }
    } catch { /* ignore wizard metadata errors */ }
    let addAns = (await ask(rl, 'Additional domains (comma-separated, optional): ')).trim();

    // Optional: interactive external discovery listing
    const external = Boolean(args && (args.external || args.experimentalExternalConstants));
    if (external) {
      try {
        const { discoverConstants } = require(path.join(__dirname, '..', 'lib', 'utils', 'discover-constants'));
        const { mergeConstants } = require(path.join(__dirname, '..', 'lib', 'utils', 'merge-constants'));
        const discovered = discoverConstants(cwd);
        const merged = mergeConstants(discovered);
        const sourcesByDomain = {};
        for (const [d, data] of Object.entries(merged || {})) {
          const srcs = (data.sources || []).map(s => s.type);
          sourcesByDomain[d] = Array.from(new Set(srcs)).join(',');
        }
        const domainList = Object.keys(sourcesByDomain).sort();
        if (domainList.length) {
          console.log('\nDiscovered domains (experimental):');
          domainList.forEach((d, i) => console.log(`  [${i+1}] ${d} (${sourcesByDomain[d]})`));
          const priPick = (await ask(rl, 'Pick primary by name or index (Enter to keep): ')).trim();
          if (priPick) {
            const idx = Number(priPick);
            if (Number.isInteger(idx) && idx>=1 && idx<=domainList.length) {
              primary = domainList[idx-1];
            } else if (domainList.includes(priPick)) {
              primary = priPick;
            }
          }
          const addPick = (await ask(rl, 'Pick additional (comma-separated names or indices, Enter to keep): ')).trim();
          if (addPick) {
            const tokens = addPick.split(',').map(s=>s.trim()).filter(Boolean);
            const chosen = [];
            for (const t of tokens) {
              const n = Number(t);
              if (Number.isInteger(n) && n>=1 && n<=domainList.length) chosen.push(domainList[n-1]);
              else if (domainList.includes(t)) chosen.push(t);
            }
            if (chosen.length) addAns = chosen.join(',');
          }
        }
      } catch (err) {
        console.warn(`(external discovery skipped: ${err && err.message})`);
      }
    }
    const additional = addAns ? addAns.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const domainPriority = [primary, ...additional];
    console.log(`\nSummary:\n  primary: ${primary}\n  additional: ${additional.join(', ') || '(none)'}\n  domainPriority: ${domainPriority.join(', ')}`);
    
    // Architecture guardrails prompt
    const { promptArchitectureGuardrails } = require(path.join(__dirname, '..', 'lib', 'wizard', 'arch-prompts'));
    const architecture = await promptArchitectureGuardrails(rl, ask);
    
    const confirm = (await ask(rl, '\nWrite .ai-coding-guide.json with these settings? (Y/n): ')).trim().toLowerCase();
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
    if (architecture) {
      cfg.architecture = architecture;
    }
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
      writeEslintConfig(cwd, cfg);
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
  let md = `# AI Coding Guide\n\nPrimary domain: ${cfg.domains.primary}\nAdditional domains: ${cfg.domains.additional.join(', ') || '(none)'}\nDomain priority: ${cfg.domainPriority.join(', ')}\n\nGuidance:\n- Use domain annotations (@domain/@domains) for ambiguous constants\n- Prefer constants and terms from active domains\n`;
if (cfg.experimentalExternalConstants) {
    try {
      const { discoverConstants } = require(path.join(__dirname, '..', 'lib', 'utils', 'discover-constants'));
      const { mergeConstants } = require(path.join(__dirname, '..', 'lib', 'utils', 'merge-constants'));
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

  // Ambiguity and precedence guidance
md += `\n## Ambiguity and Disambiguation\nWhen a numeric literal could belong to multiple domains (e.g., 360 geometry vs 360 astronomy), disambiguate:\n\n1) Inline annotation\n\n~~~js\n// @domain geometry\nconst fullCircle = 720 / 2; // 360°\n~~~\n\n2) Name-based cue\n\n~~~js\nconst circleAngleDegrees = 720 / 2;\n~~~\n\n3) Config override (project-wide)\n\n~~~json\n{\n  "constantResolution": {\n    "360": "geometry"\n  }\n}\n~~~\n\n## Active-Domain Precedence\nWhen multiple domains match, the linter prefers the first in domainPriority. Adjust this order to shape suggestions.\n\nExample:\n\n~~~json\n{\n  "domains": { "primary": "${cfg.domains.primary}", "additional": [${cfg.domains.additional.map(d=>`"${d}"`).join(', ')}] },\n  "domainPriority": [${cfg.domainPriority.map(d=>`"${d}"`).join(', ')}]\n}\n~~~\n`;
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
  // Architecture guidelines
  if (cfg.architecture) {
    md += '\n## Architecture Guidelines\n\n';
    const arch = cfg.architecture;
    
    // File organization
    if (arch.fileStructure) {
      md += `**File Organization:** ${arch.fileStructure.pattern}\n\n`;
    }
    
    // File length limits
    if (arch.maxFileLength) {
      md += '**File Length Limits:**\n';
      md += `- CLI files: ${arch.maxFileLength.cli || 100} lines\n`;
      md += `- Command files: ${arch.maxFileLength.command || 150} lines\n`;
      md += `- Utility files: ${arch.maxFileLength.util || 200} lines\n`;
      md += `- Generator files: ${arch.maxFileLength.generator || 250} lines\n`;
      md += `- Component files: ${arch.maxFileLength.component || 300} lines\n`;
      md += `- Default: ${arch.maxFileLength.default || 250} lines\n\n`;
    }
    
    // Function limits
    if (arch.functions) {
      md += '**Function Limits:**\n';
      md += `- Max length: ${arch.functions.maxLength || 50} lines\n`;
      md += `- Max complexity: ${arch.functions.maxComplexity || 10}\n`;
      md += `- Max depth: ${arch.functions.maxDepth || 4}\n`;
      md += `- Max parameters: ${arch.functions.maxParams || 4}\n`;
      md += `- Max statements: ${arch.functions.maxStatements || 30}\n\n`;
    }
    
    // Patterns
    if (arch.patterns) {
      md += '**Code Patterns:**\n';
      md += `- CLI style: ${arch.patterns.cliStyle || 'orchestration-shell'}\n`;
      md += `- Error handling: ${arch.patterns.errorHandling || 'explicit'}\n`;
      md += `- Async style: ${arch.patterns.asyncStyle || 'async-await'}\n\n`;
    }
  }
  
  // Ambiguity tactics
  md += `\n## Ambiguity Tactics\n- Prefer explicit @domain/@domains on ambiguous constants\n- Use name cues (e.g., 'circleAngleDegrees')\n- Project-wide mapping via .ai-coding-guide.json → constantResolution\n\n---\n*See .ai-coding-guide.md for details*\n`;
  fs.writeFileSync(file, md);
  console.log(`Wrote ${file}`);
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

function writeEslintConfig(cwd, cfg) {
  const file = path.join(cwd, 'eslint.config.js');
  if (fs.existsSync(file) && !process.env.FORCE_ESLINT_CONFIG) {
    console.log(`Found existing ${file} — set FORCE_ESLINT_CONFIG=1 to overwrite.`);
    return;
  }
  
  // Check if architecture guardrails are enabled
  let archRulesConfig = '';
  const hasArchGuardrails = !!(cfg && cfg.architecture);
  if (hasArchGuardrails) {
    try {
      const { generateArchitectureRules } = require(path.join(__dirname, '..', 'lib', 'generators', 'eslint-arch-config'));
      const { rules } = generateArchitectureRules(cfg.architecture);
      
      // Convert rules to ESLint config format
      const rulesStr = Object.entries(rules).map(([rule, config]) => {
        return `      '${rule}': ${JSON.stringify(config)},`;
      }).join('\n');
      
      archRulesConfig = `\n      // Architecture guardrails\n${rulesStr}`;
    } catch (err) {
      console.warn('Warning: Failed to generate architecture rules:', err.message);
    }
  }
  
  // When architecture guardrails are enabled, skip overlapping AI-friendly rules
  const aiFriendlyRules = hasArchGuardrails
    ? ''
    : `      // AI-friendly\n      'complexity': ['warn', 15],\n      'max-depth': ['warn', 4],\n      'max-lines-per-function': ['warn', 100],\n`;
  
  const content = `// Generated by eslint-plugin-ai-code-snifftest init\nimport js from '@eslint/js';\nimport aiSnifftest from 'eslint-plugin-ai-code-snifftest';\n\nexport default [\n  js.configs.recommended,\n  {\n    files: ['**/*.js'],\n    plugins: { 'ai-code-snifftest': aiSnifftest },\n    rules: {\n      // Baseline\n      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],\n      'no-undef': 'error',\n      'prefer-const': 'warn',\n      'no-var': 'error',\n      // Consistency\n      'quotes': ['warn', 'single', { avoidEscape: true }],\n      'semi': ['warn', 'always'],\n      'eqeqeq': ['error', 'always'],\n${aiFriendlyRules}      // Naming (basic)\n      'camelcase': ['error', { properties: 'always' }],\n      // Domain-specific\n      'ai-code-snifftest/no-redundant-calculations': 'warn',\n      'ai-code-snifftest/no-equivalent-branches': 'warn',\n      'ai-code-snifftest/prefer-simpler-logic': 'warn',\n      'ai-code-snifftest/no-redundant-conditionals': 'warn',\n      'ai-code-snifftest/no-unnecessary-abstraction': 'warn',\n      'ai-code-snifftest/no-generic-names': 'warn',\n      'ai-code-snifftest/enforce-domain-terms': 'warn',${archRulesConfig}\n    }\n  },\n  {\n    files: ['**/*.test.js', '**/*.spec.js'],\n    rules: { 'max-lines-per-function': 'off', 'complexity': 'off' }\n  }\n];\n`;
  fs.writeFileSync(file, content);
  console.log(`Wrote ${file}`);
}

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

function init(cwd, args) {
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

function scaffoldConstantsPkg(cwd, domainArg, outDirArg) {
  const domain = String(domainArg || '').trim();
  if (!domain) { console.error('Missing domain. Usage: eslint-plugin-ai-code-snifftest scaffold <domain> [--dir=path]'); return 1; }
  const outDir = path.resolve(cwd, outDirArg || `./${domain}`);
  fs.mkdirSync(outDir, { recursive: true });
  const pkgName = `@ai-constants/${domain}`;
  const indexJs = `module.exports = {\n  domain: '${domain}',\n  version: '1.0.0',\n  constants: [\n    { value: 42, name: 'EXAMPLE_CONSTANT', description: 'Example constant for ${domain}' }\n  ],\n  terms: { entities: ['Entity1'], properties: ['property1'], actions: ['action1'] },\n  naming: { style: 'camelCase', booleanPrefix: ['is','has','should'], constants: 'UPPER_SNAKE_CASE' }\n};\n`;
  const pkgJson = { name: pkgName, version: '1.0.0', main: 'index.js', license: 'MIT' };
  const readme = `# ${pkgName}\n\nExternal constants package for the ${domain} domain.\n`;
  const testDir = path.join(outDir, 'test');
  fs.writeFileSync(path.join(outDir, 'index.js'), indexJs);
  fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify(pkgJson, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'README.md'), readme);
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(path.join(testDir, 'validate.test.js'), `/* placeholder tests */\n`);
  console.log(`Scaffolded external constants package at ${outDir}`);
  return 0;
}

function usage() {
  console.log(`Usage:\n  eslint-plugin-ai-code-snifftest init [--primary=<domain>] [--additional=a,b,c] [--minimumMatch=0.6] [--minimumConfidence=0.7]\n  eslint-plugin-ai-code-snifftest learn [--strict|--permissive|--interactive] [--sample=N] [--no-cache] [--apply] [--fingerprint] [--minimumMatch=0.6] [--minimumConfidence=0.7]\n  eslint-plugin-ai-code-snifftest scaffold <domain> [--dir=path]\n\nExamples:\n  eslint-plugin-ai-code-snifftest init --primary=astronomy --additional=geometry,math,units --minimumMatch=0.65\n  eslint-plugin-ai-code-snifftest learn --interactive --sample=300 --minimumConfidence=0.75\n  eslint-plugin-ai-code-snifftest scaffold medical --dir=./examples/external/medical\n`);
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
  if (process.env.SKIP_AI_REQUIREMENTS || process.env.NODE_ENV === 'test') return true;
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

// --- Learn implementation ---
function deepMerge(base, override) {
  if (override == null) return base;
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

function loadProjectConfigFile(cwd) {
  const file = path.join(cwd, '.ai-coding-guide.json');
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return { file, json: JSON.parse(raw) };
  } catch {
    try {
      const { DEFAULTS } = require(path.join(__dirname, '..', 'lib', 'utils', 'project-config'));
      return { file, json: DEFAULTS };
    } catch {
      return { file, json: { domains: { primary: 'general', additional: [] }, domainPriority: [], constants:{}, terms:{ entities:[], properties:[], actions:[] }, naming:{ style:'camelCase', booleanPrefix:['is','has','should','can'], asyncPrefix:['fetch','load','save'], pluralizeCollections:true }, antiPatterns:{ forbiddenNames:[], forbiddenTerms:[] } } };
    }
  }
}

function writeProjectConfigFile(file, json) {
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
}

async function learnInteractive(cwd, args, findings, rec, currentCfg) {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((resolve)=> rl.question(q, (ans)=> resolve(ans)));
  try {
    const nextCfg = JSON.parse(JSON.stringify(currentCfg));
    console.log('\nLearn: Reconciliation Report');
    console.log(`Score: ${rec.score.overall}/100`);
    if (rec.score && rec.score.breakdown) {
      console.log('Breakdown:', rec.score.breakdown);
    }
    if (Array.isArray(rec.warnings) && rec.warnings.length) {
      console.log('Warnings:', rec.warnings);
    }

    // 1) Naming style
    console.log(`\nNaming style: suggested '${rec.result.naming.style}' (majorities: ${Object.entries(findings.naming.casing).map(([k,v])=>`${k}:${v}`).join(', ')})`);
    let ans = (await ask("[Naming] Enforce suggested style in config? [Y/n/r] (r=view report): ")).trim().toLowerCase();
    if (ans === 'r') {
      console.log(JSON.stringify({ casing: findings.naming.casing, booleanPrefixes: findings.naming.booleanPrefixes }, null, 2));
      ans = (await ask('Apply suggested style? [Y/n]: ')).trim().toLowerCase();
    }
    if (!ans || ans.startsWith('y')) {
      nextCfg.naming = nextCfg.naming || {};
      nextCfg.naming.style = rec.result.naming.style;
      const bp = Array.from(new Set(rec.result.naming.booleanPrefix || []));
      // Offer inline edit of boolean prefixes
      const edit = (await ask(`Edit boolean prefixes? current=[${bp.join(',')}] enter new comma-separated or press Enter to keep: `)).trim();
      if (edit) {
        const edited = edit.split(',').map(s=>s.trim()).filter(Boolean);
        nextCfg.naming.booleanPrefix = edited.length ? edited : bp;
      } else {
        nextCfg.naming.booleanPrefix = bp;
      }
    }

    // 2) Generic names → antiPatterns.forbiddenNames
    const forb = rec.result.antiPatterns && rec.result.antiPatterns.forbiddenNames || [];
    if (forb.length) {
      console.log(`\nGeneric names detected (suggest forbid): ${forb.join(', ')}`);
      const g = (await ask('[Generic] Add to antiPatterns.forbiddenNames? [Y/n]: ')).trim().toLowerCase();
      if (!g || g.startsWith('y')) {
        nextCfg.antiPatterns = nextCfg.antiPatterns || { forbiddenNames: [], forbiddenTerms: [] };
        const set = new Set([...(nextCfg.antiPatterns.forbiddenNames||[]), ...forb]);
        nextCfg.antiPatterns.forbiddenNames = Array.from(set);
      }
    }

    // 3) Constants domain-aware suggestions
    const consts = (rec.domain && rec.domain.constants) || [];
    const top = consts.slice(0, 10);
    if (top.length) {
      console.log('\nDomain-aware constants (high-confidence):');
      const chosen = [];
      const history = [];
      for (let i = 0; i < top.length; i++) {
        const c = top[i];
        let action = (await ask(`  [${i+1}/${top.length}] ${c.value} → ${c.suggestedName || '(name?)'} ${c.domain ? '['+c.domain+']' : ''} (conf=${Math.round(c.confidence*100)}%) [a]dd, [r]ename, [m]ap, [s]kip, [b]ack, skip-[A]ll, [q]uit: `)).trim().toLowerCase();
        if (action === 'q') break;
        if (action === 'a' && i < top.length - 1) {
          console.log('Skipping all remaining constants.');
          break;
        }
        if (action === 'b' && i > 0) {
          // Go back one step
          i = Math.max(0, i - 2);
          if (history.length > 0) {
            const last = history.pop();
            const idx = chosen.findIndex(ch => ch.value === last.value);
            if (idx !== -1) chosen.splice(idx, 1);
          }
          continue;
        }
        if (action === 'r') {
          const nn = (await ask('   New constant name (UPPER_SNAKE_CASE): ')).trim();
          if (nn) c.suggestedName = nn;
          action = 'a';
        }
        if (action === 'm') {
          const dm = (await ask('   Map value to domain (e.g., time, astronomy, geometry): ')).trim();
          if (dm) {
            nextCfg.constantResolution = nextCfg.constantResolution || {};
            nextCfg.constantResolution[String(c.value)] = dm;
            c.domain = dm;
          }
          const yn = (await ask('   Also add to fingerprint? [Y/n]: ')).trim().toLowerCase();
          if (!yn || yn.startsWith('y')) action = 'a'; else action = 's';
        }
        if (action === 'a') {
          chosen.push({ value: c.value, suggestedName: c.suggestedName, domain: c.domain, confidence: c.confidence });
          history.push(c);
        }
      }
      if (chosen.length) {
        const h = (await ask('[Constants] Generate fingerprint file with selected items? [Y/n]: ')).trim().toLowerCase();
        if (!h || h.startsWith('y')) {
          const { generateDomain } = require(path.join(__dirname, '..', 'lib', 'scanner', 'reconcile'));
          const content = generateDomain({ constants: chosen });
          const outDir = path.join(cwd, '.ai-constants');
          fs.mkdirSync(outDir, { recursive: true });
          const outFile = path.join(outDir, 'project-fingerprint.js');
          fs.writeFileSync(outFile, content);
          console.log(`Wrote ${outFile}`);
        }
      }
    }

    // 4) Apply config changes
    const apply = (await ask('\nApply changes to .ai-coding-guide.json? [Y/n]: ')).trim().toLowerCase();
    if (!apply || apply.startsWith('y')) {
      const { file } = loadProjectConfigFile(cwd);
      writeProjectConfigFile(file, nextCfg);
      console.log(`Updated ${file}`);
    } else {
      console.log('Skipped writing config.');
    }

    return 0;
  } finally {
    rl.close();
  }
}

function learn(cwd, args) {
  const { scanProject } = require(path.join(__dirname, '..', 'lib', 'scanner', 'extract'));
  const { reconcile, DEFAULT_SANITY } = require(path.join(__dirname, '..', 'lib', 'scanner', 'reconcile'));
  const { json: currentCfg } = loadProjectConfigFile(cwd);
  const modeInteractive = Boolean(args.interactive) || (!args.strict && !args.permissive && process.stdin.isTTY);
  const sample = args.sample ? Number(args.sample) : undefined;
  const useCache = args.cache === false || args['no-cache'] ? false : true;

  console.log(`Scanning project (sample: ${sample || 400}, cache: ${useCache ? 'enabled' : 'disabled'})...`);
  const findings = scanProject(cwd, { sample: sample || 400, useCache });
  console.log('✓ Scan complete');
  // Override defaults with CLI flags or config values
  const sane = { ...DEFAULT_SANITY };
  if (args.minimumMatch) sane.minimumMatch = parseFloat(args.minimumMatch);
  else if (currentCfg.minimumMatch !== undefined) sane.minimumMatch = currentCfg.minimumMatch;
  if (args.minimumConfidence) sane.minimumConfidence = parseFloat(args.minimumConfidence);
  else if (currentCfg.minimumConfidence !== undefined) sane.minimumConfidence = currentCfg.minimumConfidence;
  const mode = args.strict ? 'strict' : (args.permissive ? 'permissive' : 'adaptive');
  const rec = reconcile(findings, sane, { config: currentCfg, mode });

  if (modeInteractive) {
    return learnInteractive(cwd, args, findings, rec, currentCfg);
  }

  // Non-interactive: compute result and optionally apply
  const nextCfg = deepMerge(currentCfg, { naming: rec.result.naming, antiPatterns: rec.result.antiPatterns, constantResolution: rec.result.constantResolution });
  if (args.apply) {
    if (mode === 'permissive') {
      const reportFile = path.join(cwd, '.ai-learn-report.json');
      fs.writeFileSync(reportFile, JSON.stringify({ mode, score: rec.score, result: rec.result, warnings: rec.warnings, domain: rec.domain.summary }, null, 2) + '\n');
      console.log(`Wrote ${reportFile}`);
    } else {
      const { file } = loadProjectConfigFile(cwd);
      writeProjectConfigFile(file, nextCfg);
      console.log(`Updated ${file} (mode ${mode}, score ${rec.score.overall})`);
    }
  } else {
    console.log(JSON.stringify({ mode, score: rec.score, result: rec.result, warnings: rec.warnings, domain: rec.domain.summary }, null, 2));
  }
  if (args.fingerprint) {
    const top = (rec.domain && rec.domain.constants || []).slice(0, 10);
    if (top.length) {
      const { generateDomain } = require(path.join(__dirname, '..', 'lib', 'scanner', 'reconcile'));
      const content = generateDomain({ constants: top });
      const outDir = path.join(cwd, '.ai-constants');
      fs.mkdirSync(outDir, { recursive: true });
      const outFile = path.join(outDir, 'project-fingerprint.js');
      fs.writeFileSync(outFile, content);
      console.log(`Wrote ${outFile}`);
    }
  }
  return 0;
}

function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
  const cwd = process.cwd();
  if (cmd === 'init') {
    if (!checkRequirements(process.cwd())) { process.exitCode = 1; return; }
    if (!args.primary && (process.stdin.isTTY || process.env.FORCE_CLI_INTERACTIVE)) {
      initInteractive(cwd, args).then((code)=>{ process.exitCode = code; });
      return;
    }
    process.exitCode = init(cwd, args);
    return;
  }
  if (cmd === 'learn') {
    if (!checkRequirements(process.cwd())) { process.exitCode = 1; return; }
    Promise.resolve(learn(cwd, args)).then((code)=>{ process.exitCode = code; });
    return;
  }
  if (cmd === 'scaffold' || cmd === 'create-constants') {
    const dom = args._[1];
    const outDir = args.dir || args.out;
    process.exitCode = scaffoldConstantsPkg(cwd, dom, outDir);
    return;
  }
  usage();
}

main();