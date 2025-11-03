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
    // Prefer local lib constants (works both in repo and when installed)
    const lib = require(path.join(__dirname, '..', 'lib', 'constants'));
    if (lib && lib.DOMAINS) return lib;
} catch { /* ignore: constants lib not found */ }
  return { DOMAINS: {} };
}

function domainMeta(constantsLib) {
  const entries = Object.entries(constantsLib.DOMAINS || {});
  return entries.map(([name, mod]) => {
    const constants = Array.isArray(mod && mod.constants) ? mod.constants : [];
    const terms = Array.isArray(mod && mod.terms) ? mod.terms : [];
    const sources = Array.isArray(mod && mod.sources) ? mod.sources : [];
    return { name, constantsCount: constants.length, termsCount: terms.length, sources };
  });
}

function writeConfig(cwd, cfg) {
  const file = path.join(cwd, '.ai-coding-guide.json');
  if (fs.existsSync(file) && !process.env.FORCE_AI_CONFIG) {
    console.log(`Found existing ${file} — use FORCE_AI_CONFIG=1 to overwrite.`);
    return 0;
  }
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
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

    // Show domain metadata (sources + counts), sorted by constants desc then name
    const constantsLib = loadConstantsLib();
    const metas = domainMeta(constantsLib)
      .sort((a, b) => (b.constantsCount - a.constantsCount) || a.name.localeCompare(b.name));
    console.log('\nDiscovered domains:');
    for (const m of metas) {
      const src = m.sources && m.sources.length ? m.sources.join(', ') : 'internal';
      console.log(`  - ${m.name} (constants: ${m.constantsCount}, terms: ${m.termsCount}, sources: ${src})`);
    }

    if (metas.find(d => d.name === primary && d.constantsCount === 0)) {
      console.warn(`⚠️ Warning: selected primary '${primary}' has zero discovered constants.`);
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

function writeGuideMd(cwd, cfg) {
  const file = path.join(cwd, '.ai-coding-guide.md');
  const header = `# AI Coding Guide\n\nPrimary domain: ${cfg.domains.primary}\nAdditional domains: ${cfg.domains.additional.join(', ') || '(none)'}\nDomain priority: ${cfg.domainPriority.join(', ')}\n\nGuidance:\n- Use domain annotations (@domain/@domains) for ambiguous constants\n- Prefer constants and terms from active domains\n`;

  // Build per-domain sections from constants library
  const { DOMAINS } = loadConstantsLib();
  const sections = [];
  for (const d of cfg.domainPriority) {
    const mod = DOMAINS ? DOMAINS[d] : null;
    const constants = Array.isArray(mod && mod.constants) ? mod.constants : [];
    const terms = Array.isArray(mod && mod.terms) ? mod.terms : [];
    const sources = Array.isArray(mod && mod.sources) ? mod.sources : [];
    sections.push(`## Domain: ${d}\n\n- Sources: ${sources.length ? sources.join(', ') : 'internal'}\n- Constants (${constants.length}): ${constants.map(v => String(v)).join(', ') || '(none)'}\n- Terminology (${terms.length}): ${terms.join(', ') || '(none)'}\n`);
  }
  const md = header + (sections.length ? `\n${sections.join('\n')}` : '');
  fs.writeFileSync(file, md);
  console.log(`Wrote ${file}`);
}

function writeAgentsMd(cwd, cfg) {
  const file = path.join(cwd, 'AGENTS.md');
  const md = `# AI Rules\n\nPrimary domain: ${cfg.domains.primary}\nAdditional: ${cfg.domains.additional.join(', ') || '(none)'}\nPriority: ${cfg.domainPriority.join(', ')}\n\n## Naming\n- Style: ${cfg.naming.style}\n- Booleans: isX/hasX/shouldX/canX\n- Async: fetchX/loadX/saveX\n\n## Guidance\n- Use @domain/@domains annotations for ambiguous constants\n- Prefer constants/terms from active domains\n\n---\n*See .ai-coding-guide.md for details*\n`;
  fs.writeFileSync(file, md);
  console.log(`Wrote ${file}`);
}

function writeCursorRules(cwd, cfg) {
  const file = path.join(cwd, '.cursorrules');
  const payload = {
    rules: [
      `Primary domain: ${cfg.domains.primary}`,
      `Additional domains: ${cfg.domains.additional.join(', ')}`,
      'Prefer explicit @domain annotations for ambiguous constants.'
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
  const content = `// Generated by eslint-plugin-ai-code-snifftest init\nimport aiSnifftest from 'eslint-plugin-ai-code-snifftest';\n\nexport default [\n  {\n    plugins: { 'ai-code-snifftest': aiSnifftest },\n    rules: {\n      'ai-code-snifftest/no-redundant-calculations': 'error',\n      'ai-code-snifftest/no-equivalent-branches': 'error',\n      'ai-code-snifftest/prefer-simpler-logic': 'error',\n      'ai-code-snifftest/no-redundant-conditionals': 'error',\n      'ai-code-snifftest/no-unnecessary-abstraction': 'warn',\n      'ai-code-snifftest/no-generic-names': 'warn',\n      'ai-code-snifftest/enforce-domain-terms': 'warn'\n    }\n  }\n];\n`;
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
  console.log(`Usage:
  eslint-plugin-ai-code-snifftest init [--primary=<domain>] [--additional=a,b,c]
  eslint-plugin-ai-code-snifftest learn [--strict|--permissive|--interactive] [--fingerprint] [--accept-defaults]

Examples:
  eslint-plugin-ai-code-snifftest init --primary=astronomy --additional=geometry,math,units
  eslint-plugin-ai-code-snifftest learn --strict
  eslint-plugin-ai-code-snifftest learn --interactive --accept-defaults
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

function checkRequirements(cwd, opts = { requireEslint: true }) {
  let ok = true;
  const nodeVer = process.versions.node;
  if (!gte(nodeVer, '18.0.0')) {
    console.error(`❌ Node.js 18+ required. You have ${nodeVer}. Install Node 18+ (recommended 20+).`);
    ok = false;
  } else {
    console.log(`✅ Node.js ${nodeVer}`);
  }
  if (opts.requireEslint) {
    const eslintVer = resolvePkgVersion('eslint', cwd);
    if (!eslintVer || !gte(eslintVer, '9.0.0')) {
      console.error(`❌ ESLint 9+ required. Your project: ${eslintVer || 'not installed'}.`);
      console.error(`   Upgrade: npm install eslint@^9.0.0`);
      ok = false;
    } else {
      console.log(`✅ ESLint ${eslintVer}`);
    }
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

function writeFingerprint(cwd, report) {
  const dir = path.join(cwd, '.ai-constants');
try { if (!fs.existsSync(dir)) fs.mkdirSync(dir); } catch { /* ignore: cannot create fingerprint dir */ }
  const file = path.join(dir, 'project-fingerprint.js');
  const content = `export default ${JSON.stringify(report.result, null, 2)}\n`;
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Wrote ${file}`);
}

function readJsonSafe(file) {
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function updateGuideConfig(cwd, patch) {
  const file = path.join(cwd, '.ai-coding-guide.json');
  const existing = readJsonSafe(file) || {};
  const next = Object.assign({}, existing);
  next.naming = Object.assign({}, existing.naming || {}, patch.naming || {});
  if (patch.antiPatterns) {
    const prevForbidden = (existing.antiPatterns && existing.antiPatterns.forbiddenNames) || [];
    const addForbidden = patch.antiPatterns.forbiddenNames || [];
    const merged = Array.from(new Set([...prevForbidden, ...addForbidden]));
    next.antiPatterns = Object.assign({}, existing.antiPatterns || {}, { forbiddenNames: merged });
  }
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${file}`);
}

function learn(cwd, args) {
  const { extractFindings } = require('../lib/scanner/extract');
  const { reconcile } = require('../lib/scanner/reconcile');
  const mode = args.strict ? 'strict' : (args.permissive ? 'permissive' : 'adaptive');
  const sanityRules = {
    naming: { style: 'camelCase', booleanPrefix: ['is','has','should','can'], constants: 'UPPER_SNAKE_CASE' },
    minimumConfidence: mode === 'strict' ? 0.9 : 0.7,
    minimumMatch: mode === 'permissive' ? 0.5 : 0.6
  };
  const findings = extractFindings(cwd, { mode });
  const report = reconcile(findings, sanityRules, { mode });
  const out = path.join(cwd, 'learn-report.json');
  fs.writeFileSync(out, JSON.stringify({ findings, ...report }, null, 2), 'utf8');
  console.log(`Wrote ${out}`);
  if (args.fingerprint) writeFingerprint(cwd, report);
  if (args.interactive) {
    if (args['accept-defaults']) {
      updateGuideConfig(cwd, {
        naming: report.result.naming,
        antiPatterns: report.result.antiPatterns
      });
    } else {
      const readline = require('readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const ask = (q) => new Promise((r)=> rl.question(q, (a)=> r(a.trim())));
      (async () => {
        console.log('\n=== Learn: Interactive Review ===');
        console.log(`Recommended naming.style: ${report.result.naming.style}`);
        const style = (await ask(`Enforce naming.style='${report.result.naming.style}'? (Y/n): `)).toLowerCase();
        const applyStyle = !style || style.startsWith('y');
        const prefixes = report.result.naming.booleanPrefix.join(', ');
        const bp = (await ask(`Enforce booleanPrefix=[${prefixes}]? (Y/n): `)).toLowerCase();
        const applyBP = !bp || bp.startsWith('y');
        const forb = report.result.antiPatterns.forbiddenNames || [];
        let applyForbidden = false;
        if (forb.length) {
          const ap = (await ask(`Add forbiddenNames [${forb.join(', ')}] to config? (Y/n): `)).toLowerCase();
          applyForbidden = !ap || ap.startsWith('y');
        }
        const patch = { naming: {}, antiPatterns: { forbiddenNames: [] } };
        if (applyStyle) patch.naming.style = report.result.naming.style;
        if (applyBP) patch.naming.booleanPrefix = report.result.naming.booleanPrefix;
        if (applyForbidden && forb.length) patch.antiPatterns.forbiddenNames = forb;
        updateGuideConfig(cwd, patch);
        rl.close();
      })();
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
    if (!args.primary && process.stdin.isTTY) {
      initInteractive(cwd).then((code)=>{ process.exitCode = code; });
      return;
    }
    process.exitCode = init(cwd, args);
    return;
  }
if (cmd === 'learn') {
    if (!checkRequirements(process.cwd(), { requireEslint: false })) { process.exitCode = 1; return; }
    process.exitCode = learn(cwd, args);
    return;
  }
  usage();
}

main();