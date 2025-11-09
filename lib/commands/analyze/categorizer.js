'use strict';

function push(map, key, item) {
  if (!map[key]) map[key] = [];
  map[key].push(item);
}

// Classification helpers (reduce complexity in main function)
function isMagicRule(rule) {
  return rule.includes('no-redundant-calculations');
}
function isComplexityRule(rule) {
  return rule === 'complexity' ||
    rule.includes('prefer-simpler-logic') ||
    rule.includes('no-equivalent-branches') ||
    rule.includes('no-redundant-conditionals');
}
function isDomainTermsRule(rule) {
  return rule.includes('enforce-domain-terms') || rule.includes('no-generic-names');
}
function isArchitectureRule(rule) {
  return rule.includes('max-lines') ||
    rule.includes('max-lines-per-function') ||
    rule.includes('max-statements') ||
    rule.includes('max-depth') ||
    rule.includes('max-params');
}

function makeRec(filePath, m) {
  return { filePath, message: m.message, ruleId: m.ruleId, line: m.line, column: m.column };
}

function tallyCounts(counts, m, usedFileFixable) {
  if (m.severity === 2) counts.errors += 1; else counts.warnings += 1;
  if (m.fix && !usedFileFixable) counts.autoFixable += 1;
}

// New helpers to reduce complexity further
function addFileFixable(counts, f) {
  const fileFixable = (f && ((f.fixableWarningCount || 0) + (f.fixableErrorCount || 0))) || 0;
  if (fileFixable > 0) {
    counts.autoFixable += fileFixable;
    return true;
  }
  return false;
}

function routeRec(out, rule, rec) {
  if (isMagicRule(rule)) {
    push(out, 'magicNumbers', rec);
  } else if (isComplexityRule(rule)) {
    push(out, 'complexity', rec);
  } else if (isDomainTermsRule(rule)) {
    push(out, 'domainTerms', rec);
  } else if (isArchitectureRule(rule)) {
    push(out, 'architecture', rec);
  }
}

function processMessage(out, f, m, usedFileFixable) {
  const rule = String(m.ruleId || '').toLowerCase();
  tallyCounts(out.counts, m, usedFileFixable);
  const rec = makeRec(f.filePath, m);
  routeRec(out, rule, rec);
}

function processFile(out, f) {
  const usedFileFixable = addFileFixable(out.counts, f);
  const messages = Array.isArray(f && f.messages) ? f.messages : [];
  for (const m of messages) processMessage(out, f, m, usedFileFixable);
}

function categorizeViolations(eslintJson /* array */, cfg) {
  const out = {
    magicNumbers: [],
    complexity: [],
    domainTerms: [],
    architecture: [],
    counts: { errors: 0, warnings: 0, autoFixable: 0 }
  };
  const files = Array.isArray(eslintJson) ? eslintJson : [];
  for (const f of files) processFile(out, f);
  return out;
}

module.exports = { categorizeViolations };
