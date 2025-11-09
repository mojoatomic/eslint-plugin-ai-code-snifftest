#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  } catch (e) {
    return null;
  }
}

function num(x) { return typeof x === 'number' && Number.isFinite(x) ? x : 0; }

function summarize(payload) {
  const cat = payload && payload.categories ? payload.categories : {};
  const effort = payload && payload.effort ? payload.effort : {};
  const byCat = (effort && effort.byCategory) ? effort.byCategory : {};
  return {
    magicNumbers: Array.isArray(cat.magicNumbers) ? cat.magicNumbers.length : 0,
    complexity: Array.isArray(cat.complexity) ? cat.complexity.length : 0,
    domainTerms: Array.isArray(cat.domainTerms) ? cat.domainTerms.length : 0,
    architecture: Array.isArray(cat.architecture) ? cat.architecture.length : 0,
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
    }
  };
}

function loadRatchetConfig() {
  const cfg = readJson('.ai-coding-guide.json');
  const r = (cfg && cfg.ratchet) || {};
  const defaults = {
    weights: { complexity: 10, architecture: 8, domainTerms: 2, magicNumbers: 1 }
  };
  return { weights: { ...defaults.weights, ...(r.weights || {}) } };
}

function computeWeightedScore(summary, weights) {
  const w = weights || {};
  return (
    (num(summary.complexity) * (w.complexity || 0)) +
    (num(summary.architecture) * (w.architecture || 0)) +
    (num(summary.domainTerms) * (w.domainTerms || 0)) +
    (num(summary.magicNumbers) * (w.magicNumbers || 0))
  );
}

function collectFilePaths(payload) {
  const cat = (payload && payload.categories) || {};
  const sets = [cat.magicNumbers, cat.complexity, cat.domainTerms, cat.architecture].filter(Array.isArray);
  const files = new Set();
  for (const arr of sets) {
    for (const rec of arr) {
      if (rec && rec.filePath) files.add(rec.filePath);
    }
  }
  return files;
}

function countLines(p) {
  try {
    const s = fs.readFileSync(path.isAbsolute(p) ? p : path.join(process.cwd(), p), 'utf8');
    return s.split(/\r?\n/).length;
  } catch (_) {
    return 0;
  }
}

function computeDensity(summary, payload) {
  const files = collectFilePaths(payload);
  let loc = 0;
  for (const f of files) loc += countLines(f);
  const total = num(summary.magicNumbers) + num(summary.domainTerms) + num(summary.architecture) + num(summary.complexity);
  const perK = loc > 0 ? (total / loc) * 1000 : 0;
  return { loc, total, perK };
}

function appendRefactorLog({ description, baseSummary, currSummary, baseDensity, currDensity, baseWeighted, currWeighted }) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const file = 'REFACTORING-LOG.md';
  const lines = [];
  lines.push(`\n## ${date}: ${description}`);
  lines.push('');
  lines.push('Before:');
  lines.push(`- Total: ${baseSummary.magicNumbers + baseSummary.domainTerms + baseSummary.architecture + baseSummary.complexity}`);
  lines.push(`- Weighted: ${baseWeighted.toFixed(2)}`);
  lines.push(`- Density: ${baseDensity.perK.toFixed(3)} per 1k LOC (loc=${baseDensity.loc})`);
  lines.push('');
  lines.push('After:');
  lines.push(`- Total: ${currSummary.magicNumbers + currSummary.domainTerms + currSummary.architecture + currSummary.complexity}`);
  lines.push(`- Weighted: ${currWeighted.toFixed(2)} (${(currWeighted - baseWeighted).toFixed(2)})`);
  lines.push(`- Density: ${currDensity.perK.toFixed(3)} per 1k LOC (loc=${currDensity.loc})`);
  lines.push('');
  lines.push('Categories:');
  for (const key of ['complexity','architecture','domainTerms','magicNumbers']) {
    const a = baseSummary[key] || 0; const b = currSummary[key] || 0;
    const diff = b - a; const sign = diff > 0 ? '+' : '';
    lines.push(`- ${key}: ${a} -> ${b} (${sign}${diff})`);
  }
  lines.push('');
  lines.push('_Intentional baseline refresh after refactoring._');
  fs.appendFileSync(file, lines.join('\n') + '\n');
}

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function main() {
  const args = parseArgs(process.argv);
  const refactoring = String(args.refactoring || 'false').toLowerCase() === 'true';
  const description = String(args.description || '').trim();

  // Capture previous baseline (if present)
  const prevBaseline = readJson('analysis-baseline.json');

  // Always regenerate current analysis first
  run('npm run lint:json');
  run('npm run analyze:current');

  // If refactoring: compute deltas against previous baseline before overwriting
  let baseSummary = null, baseDensity = null, baseWeighted = null;
  const currRaw = readJson('analysis-current.json');
  const currSummary = currRaw ? summarize(currRaw) : null;
  const { weights } = loadRatchetConfig();

  if (refactoring) {
    if (!prevBaseline) {
      console.warn('[guardrails:baseline] No existing baseline to compare against; proceeding.');
    } else {
      baseSummary = summarize(prevBaseline);
      baseDensity = computeDensity(baseSummary, prevBaseline);
      baseWeighted = computeWeightedScore(baseSummary, weights);
    }
  }

  // Overwrite baseline intentionally
  run('npm run analyze:baseline');

  // Append refactoring log entry if requested and we have current analysis
  if (refactoring) {
    if (!description) {
      console.error('[guardrails:baseline] --description is required with --refactoring');
      process.exit(1);
      return;
    }
    if (!currSummary) {
      console.error('[guardrails:baseline] analysis-current.json missing; cannot log refactoring');
      process.exit(1);
      return;
    }
    const currDensity = computeDensity(currSummary, currRaw);
    const currWeighted = computeWeightedScore(currSummary, weights);
    appendRefactorLog({
      description,
      baseSummary: baseSummary || { magicNumbers: 0, domainTerms: 0, architecture: 0, complexity: 0 },
      currSummary,
      baseDensity: baseDensity || { perK: 0, loc: 0 },
      currDensity,
      baseWeighted: baseWeighted || 0,
      currWeighted
    });
    console.log('[guardrails:baseline] Refactoring log updated.');
  }

  console.log('[guardrails:baseline] Baseline refreshed.');
}

main();
