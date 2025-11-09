#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.split('=');
      const key = k.replace(/^--/, '');
      out[key] = v === undefined ? true : v;
    } else {
      out._.push(a);
    }
  }
  return out;
}

function readJson(p) {
  try {
    const full = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
    return JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch {
    return null;
  }
}

function len(x) { return Array.isArray(x) ? x.length : 0; }
function num(x) { return typeof x === 'number' && Number.isFinite(x) ? x : 0; }

function summarize(payload) {
  // Expected shape includes categories, effort, optional lines
  const cat = payload && payload.categories ? payload.categories : {};
  const effort = payload && payload.effort ? payload.effort : {};
  const byCat = (effort && effort.byCategory) ? effort.byCategory : {};
  const lines = payload && payload.lines ? payload.lines : {};
  return {
    magicNumbers: len(cat.magicNumbers),
    complexity: len(cat.complexity),
    domainTerms: len(cat.domainTerms),
    architecture: len(cat.architecture),
    // Optional counts (informational)
    counts: {
      errors: num(cat.counts && cat.counts.errors),
      warnings: num(cat.counts && cat.counts.warnings),
      autoFixable: num(cat.counts && cat.counts.autoFixable)
    },
    effortByCategory: {
      magicNumbers: num(byCat.magicNumbers),
      complexity: num(byCat.complexity),
      domainTerms: num(byCat.domainTerms),
      architecture: num(byCat.architecture)
    },
    lines: {
      physical: num(lines.physical),
      executable: num(lines.executable),
      comments: num(lines.comments),
      commentRatio: typeof lines.commentRatio === 'number' ? lines.commentRatio : 0
    }
  };
}

function compare(base, curr) {
  const fields = ['magicNumbers', 'complexity', 'domainTerms', 'architecture'];
  const deltas = [];
  for (const f of fields) {
    const b = num(base[f]);
    const c = num(curr[f]);
    if (c > b) deltas.push({ key: f, base: b, current: c, type: 'count' });
  }
  // Effort ratchet (optional, do not fail but report increases)
  const effortInc = [];
  for (const f of fields) {
    const b = num(base.effortByCategory && base.effortByCategory[f]);
    const c = num(curr.effortByCategory && curr.effortByCategory[f]);
    if (c > b) effortInc.push({ key: f, base: b, current: c, type: 'effort' });
  }
  return { deltas, effortInc };
}

function main() {
  const args = parseArgs(process.argv);
  const baselinePath = args.baseline || args._[0] || 'analysis-baseline.json';
  const currentPath = args.current || args._[1] || 'analysis-current.json';

  const base = readJson(baselinePath);
  if (!base) {
    console.log(`[ratchet] Baseline not found at ${baselinePath}.\n` +
      'Run: npm run lint:json && npm run analyze:baseline\n' +
      'Skipping ratchet (non-blocking)');
    process.exit(0);
    return;
  }
  const curr = readJson(currentPath);
  if (!curr) {
    console.error(`[ratchet] Current analysis not found at ${currentPath}. Run: npm run lint:json && npm run analyze:current`);
    process.exit(1);
    return;
  }

  const b = summarize(base);
  const c = summarize(curr);
  const { deltas, effortInc } = compare(b, c);

  if (deltas.length === 0) {
    console.log('[ratchet] OK: no increases in analyzer categories');
    if (effortInc.length) {
      const linesInfo = effortInc.map(d => `  effort.${d.key}: ${d.base}h -> ${d.current}h`);
      console.log('[ratchet] Note: effort increased (informational):\n' + linesInfo.join('\n'));
    }
    // Non-blocking: show line metrics deltas if present
    if ((b.lines && (b.lines.physical || b.lines.executable)) || (c.lines && (c.lines.physical || c.lines.executable))) {
      const physB = num(b.lines && b.lines.physical);
      const physC = num(c.lines && c.lines.physical);
      const exB = num(b.lines && b.lines.executable);
      const exC = num(c.lines && c.lines.executable);
      const crB = b.lines ? b.lines.commentRatio : 0;
      const crC = c.lines ? c.lines.commentRatio : 0;
      console.log('[ratchet] Lines (informational):');
      if (physB || physC) console.log(`  physical: ${physB} -> ${physC} (${physC - physB >= 0 ? '+' : ''}${physC - physB})`);
      if (exB || exC) console.log(`  executable: ${exB} -> ${exC} (${exC - exB >= 0 ? '+' : ''}${exC - exB})`);
      console.log(`  commentRatio: ${(crB*100).toFixed(1)}% -> ${(crC*100).toFixed(1)}%`);
    }
    process.exit(0);
    return;
  }

  console.error('[ratchet] FAIL: new violations introduced');
  for (const d of deltas) {
    console.error(`  ${d.key}: ${d.base} -> ${d.current} (+${d.current - d.base})`);
  }
  console.error('\nTo inspect:');
  console.error('  - open analysis-current.json');
  console.error('  - compare with analysis-baseline.json');
  console.error('\nIf intentional reductions were made and counts decreased overall, refresh baseline:');
  console.error('  npm run analyze:baseline');
  process.exit(1);
}

main();
