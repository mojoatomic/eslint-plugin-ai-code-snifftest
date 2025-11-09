'use strict';

const path = require('path');
const fs = require('fs');
const { generateIssues, generateInstructions } = require('./markdown');
const { readProjectConfig } = require(path.join(__dirname, '..', '..', 'utils', 'project-config'));

function numArg(v, d) { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; }

function tryReadJson(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }

// ===== Helpers to reduce createIssuesCommand complexity =====
function parseOptions(args) {
  const input = args._ && args._[1] ? args._[1] : (args.input || 'lint-results.json');
  const outDir = args.output || 'issues';
  const format = (args.format || 'markdown').toLowerCase();
  const includeCmd = (args['include-commands'] || 'github-cli').toLowerCase();
  const labels = args.labels || 'lint,tech-debt';
  const topFiles = numArg(args['top-files'] || args.topFiles, 10);
  const minCount = numArg(args['min-count'] || args.minCount, 1);
  const maxExamples = numArg(args['max-examples'] || args.maxExamples, 5);
  return { input, outDir, format, includeCmd, labels, topFiles, minCount, maxExamples };
}

function readLintJson(cwd, input) {
  const file = path.isAbsolute(input) ? input : path.join(cwd, input);
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

function loadConfig(cwd) {
  return readProjectConfig({ getFilename: () => path.join(cwd, 'placeholder.js'), getCwd: () => cwd });
}

function resolveAnalysis(cwd) {
  const analysisPath = path.join(cwd, 'analysis.json');
  return tryReadJson(analysisPath);
}

function ensureOutDir(cwd, outDir) {
  fs.mkdirSync(path.join(cwd, outDir), { recursive: true });
}

function writeOutputs({ cwd, outDir, json, opts, cfg, analysis }) {
  generateIssues(cwd, outDir, json, { format: opts.format, cfg, topFiles: opts.topFiles, minCount: opts.minCount, maxExamples: opts.maxExamples, analysis });
  generateInstructions(cwd, outDir, { includeCmd: opts.includeCmd, labels: opts.labels });
}

function createIssuesCommand(cwd, args) {
  try {
    const opts = parseOptions(args);
    if (opts.format !== 'markdown' && opts.format !== 'json') throw new Error(`Unsupported format: ${opts.format}`);
    const json = readLintJson(cwd, opts.input);
    const cfg = loadConfig(cwd);
    const analysis = resolveAnalysis(cwd);
    ensureOutDir(cwd, opts.outDir);
    writeOutputs({ cwd, outDir: opts.outDir, json, opts, cfg, analysis });
    return 0;
  } catch (e) {
    console.error(`create-issues failed: ${e && e.message}`);
    return 1;
  }
}

module.exports = { createIssuesCommand };
