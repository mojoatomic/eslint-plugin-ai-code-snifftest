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



function writeConfig(cwd, cfg) {
  const file = path.join(cwd, '.ai-coding-guide.json');
  if (fs.existsSync(file) && !process.env.FORCE_AI_CONFIG) {
    console.log(`Found existing ${file} — use FORCE_AI_CONFIG=1 to overwrite.`);
    return 0;
  }
  const { generateCodingGuideJson } = require(path.join(__dirname, '..', 'lib', 'generators', 'coding-guide-json'));
  const content = generateCodingGuideJson(cwd, cfg);
  fs.writeFileSync(file, content);
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
  const { generateCodingGuideMd } = require(path.join(__dirname, '..', 'lib', 'generators', 'coding-guide-md'));
  const md = generateCodingGuideMd(cwd, cfg);
  fs.writeFileSync(file, md);
  console.log(`Wrote ${file}`);
}

function writeAgentsMd(cwd, cfg) {
  const file = path.join(cwd, 'AGENTS.md');
  const { generateAgentsMd } = require(path.join(__dirname, '..', 'lib', 'generators', 'agents-md'));
  const md = generateAgentsMd(cwd, cfg);
  fs.writeFileSync(file, md);
  console.log(`Wrote ${file}`);
}

function writeCursorRules(cwd, cfg) {
  const file = path.join(cwd, '.cursorrules');
  const { generateCursorrules } = require(path.join(__dirname, '..', 'lib', 'generators', 'cursorrules'));
  const content = generateCursorrules(cfg);
  fs.writeFileSync(file, content);
  console.log(`Wrote ${file}`);
}

function writeEslintConfig(cwd) {
  const file = path.join(cwd, 'eslint.config.js');
  if (fs.existsSync(file) && !process.env.FORCE_ESLINT_CONFIG) {
    console.log(`Found existing ${file} — set FORCE_ESLINT_CONFIG=1 to overwrite.`);
    return;
  }
  const { generateEslintConfig } = require(path.join(__dirname, '..', 'lib', 'generators', 'eslint-config'));
  const content = generateEslintConfig();
  fs.writeFileSync(file, content);
  console.log(`Wrote ${file}`);
}

function init(cwd, args) {
  const primary = (args.primary || 'general').trim();
  const additional = (args.additional || '').split(',').map(s => s.trim()).filter(Boolean);
  const domainPriority = [primary, ...additional];
const external = Boolean(args.external || args.experimentalExternalConstants);
  const allowlist = (args.allowlist || '').split(',').map(s=>s.trim()).filter(Boolean);
  const cfg = {
    domains: { primary, additional },
    domainPriority,
    constants: {},
    terms: { entities: [], properties: [], actions: [] },
    naming: { style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true },
    antiPatterns: { forbiddenNames: [], forbiddenTerms: [] },
    experimentalExternalConstants: external,
    externalConstantsAllowlist: allowlist
  };
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
  if (args.eslint || args.yes) writeEslintConfig(cwd);
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
  console.log(`Usage:\n  eslint-plugin-ai-code-snifftest init [--primary=<domain>] [--additional=a,b,c]\n  eslint-plugin-ai-code-snifftest scaffold <domain> [--dir=path]\n\nExamples:\n  eslint-plugin-ai-code-snifftest init --primary=astronomy --additional=geometry,math,units\n  eslint-plugin-ai-code-snifftest scaffold medical --dir=./examples/external/medical\n`);
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

function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
  const cwd = process.cwd();
  if (cmd === 'init') {
    if (!checkRequirements(process.cwd())) { process.exitCode = 1; return; }
    if (!args.primary && process.stdin.isTTY) {
      initInteractive(cwd, args).then((code)=>{ process.exitCode = code; });
      return;
    }
    process.exitCode = init(cwd, args);
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