'use strict';

const fs = require('fs');
const path = require('path');
const { readProjectConfig } = require(path.join(__dirname, '..', '..', 'utils', 'project-config'));
const { categorizeViolations } = require('./categorizer');
const { estimateEffort } = require('./estimator');
const { writeAnalysisReport } = require('./reporter');
const { attachDomainContext } = require('./domain');

function numArg(v, d) { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; }

// ===== Extracted helpers to reduce complexity =====
function resolveInputPath(cwd, args) {
  const input = args._ && args._[1] ? args._[1] : (args.input || 'lint-results.json');
  return path.isAbsolute(input) ? input : path.join(cwd, input);
}

function parseOptions(args) {
  const outFile = args.output || 'analysis-report.md';
  const format = (args.format || 'markdown').toLowerCase();
  const useFileSize = String(args['estimate-size'] ?? args.estimateSize ?? 'false').toLowerCase() === 'true';
  const topFiles = numArg(args['top-files'] || args.topFiles, 10);
  const minCount = numArg(args['min-count'] || args.minCount, 1);
  const maxExamples = numArg(args['max-examples'] || args.maxExamples, 5);
  return { outFile, format, useFileSize, topFiles, minCount, maxExamples };
}

function readLintJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

function loadConfig(cwd) {
  return readProjectConfig({ getFilename: () => path.join(cwd, 'placeholder.js'), getCwd: () => cwd });
}

function analyze(categories, cfg, cwd, useFileSize) {
  const effort = estimateEffort(categories, { cwd, useFileSize });
  return { categories, effort, cfg };
}

function computeCategories(json, cfg) {
  let categories = categorizeViolations(json, cfg);
  categories = attachDomainContext(categories, cfg);
  return categories;
}

function escapeHtml(s) {
  const htmlChars = { '&':'&amp;','<':'&lt;','>':'&gt;' };
  return s.replace(/[&<>]/g, (ch) => htmlChars[ch]);
}

function writeOutput(cwd, opts, payload) {
  const outPath = path.join(cwd, opts.outFile);
  if (opts.format === 'markdown') {
    writeAnalysisReport(outPath, { ...payload, topFiles: opts.topFiles, minCount: opts.minCount, maxExamples: opts.maxExamples });
    return;
  }
  if (opts.format === 'json') {
    fs.writeFileSync(outPath, JSON.stringify({ categories: payload.categories, effort: payload.effort }, null, 2) + '\n');
    return;
  }
  if (opts.format === 'html') {
    const md = writeAnalysisReport(null, { ...payload, returnString: true });
    const html = `<!doctype html><meta charset="utf-8"><title>Analysis Report</title><pre>${escapeHtml(md)}</pre>`;
    fs.writeFileSync(outPath, html);
  }
}

function analyzeCommand(cwd, args) {
  try {
    const file = resolveInputPath(cwd, args);
    const opts = parseOptions(args);
    const json = readLintJson(file);
    const cfg = loadConfig(cwd);
    const categories = computeCategories(json, cfg);
    const payload = analyze(categories, cfg, cwd, opts.useFileSize);
    writeOutput(cwd, opts, payload);
    return 0;
  } catch (e) {
    console.error(`analyze failed: ${e && e.message}`);
    return 1;
  }
}

module.exports = { analyzeCommand };
