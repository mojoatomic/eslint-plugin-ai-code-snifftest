'use strict';

const fs = require('fs');
const path = require('path');

function round1(x) { return Math.round(x * 10) / 10; }

// Per-rule-type weighting (hours per occurrence)
const RULE_WEIGHTS = new Map([
  // Complexity family
  ['complexity', 1.5],
  ['ai-code-snifftest/prefer-simpler-logic', 1.0],
  ['ai-code-snifftest/no-redundant-conditionals', 0.8],
  ['ai-code-snifftest/no-equivalent-branches', 0.8],
  // Architecture guardrails
  ['max-lines-per-function', 0.25],
  ['max-statements', 0.2],
  ['max-lines', 0.15],
  ['max-depth', 0.15],
  ['max-params', 0.1],
  // Domain terms
  ['ai-code-snifftest/enforce-domain-terms', 0.1],
  ['ai-code-snifftest/no-generic-names', 0.08],
  // Magic numbers
  ['ai-code-snifftest/no-redundant-calculations', 0.05]
]);
const DEFAULT_RULE_WEIGHT = 0.1;

function getFileLinesCount(cwd, filePath) {
  try {
    const p = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
    const content = fs.readFileSync(p, 'utf8');
    return content.split(/\r?\n/).length;
  } catch (_) {
    return null;
  }
}

function fileSizeFactor(lines) {
  if (!Number.isFinite(lines) || lines <= 0) return 1;
  // Scale up gradually, cap at 2x for very large files
  const factor = 1 + Math.min(lines / 1000, 1);
  return factor;
}

// ===== Extracted helpers to reduce complexity =====
function computeBaseWeight(ruleId) {
  const rule = String(ruleId || '').toLowerCase();
  return RULE_WEIGHTS.get(rule) ?? DEFAULT_RULE_WEIGHT;
}

function getCachedLines(cwd, filePath, cache) {
  if (!filePath) return null;
  if (cache.has(filePath)) return cache.get(filePath);
  const lines = getFileLinesCount(cwd, filePath);
  cache.set(filePath, lines);
  return lines;
}

function weightForRecord(rec, opts, cache) {
  let weight = computeBaseWeight(rec.ruleId);
  if (opts.useFileSize && rec.filePath) {
    const lines = getCachedLines(opts.cwd, rec.filePath, cache);
    weight *= fileSizeFactor(lines);
  }
  return weight;
}

function accumulate(cat, rec, state, opts) {
  const w = weightForRecord(rec, opts, state.fileLinesCache);
  state.byCategoryHours[cat] += w;
  state.totalHours += w;
}

function toDurations(totalHours) {
  const days = totalHours / 8;
  const weeks = days / 5;
  return { hours: round1(totalHours), days: round1(days), weeks: round1(weeks) };
}

function estimateEffort(categories, { cwd = process.cwd(), useFileSize = false } = {}) {
  const c = categories || {};
  const lists = [
    ['magicNumbers', c.magicNumbers || []],
    ['domainTerms', c.domainTerms || []],
    ['architecture', c.architecture || []],
    ['complexity', c.complexity || []]
  ];

  const state = {
    fileLinesCache: new Map(),
    byCategoryHours: { magicNumbers: 0, domainTerms: 0, architecture: 0, complexity: 0 },
    totalHours: 0
  };
  const opts = { cwd, useFileSize };

  for (const [cat, arr] of lists) {
    for (const rec of arr) accumulate(cat, rec, state, opts);
  }

  const { hours, days, weeks } = toDurations(state.totalHours);
  return {
    hours, days, weeks,
    byCategory: {
      magicNumbers: round1(state.byCategoryHours.magicNumbers),
      domainTerms: round1(state.byCategoryHours.domainTerms),
      architecture: round1(state.byCategoryHours.architecture),
      complexity: round1(state.byCategoryHours.complexity)
    }
  };
}

module.exports = { estimateEffort };
