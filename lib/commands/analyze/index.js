'use strict';

const fs = require('fs');
const path = require('path');
const { readProjectConfig } = require(path.join(__dirname, '..', '..', 'utils', 'project-config'));
const { categorizeViolations } = require('./categorizer');
const { estimateEffort } = require('./estimator');
const { writeAnalysisReport } = require('./reporter');
const { attachDomainContext } = require('./domain');

function numArg(v, d) { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; }

function analyzeCommand(cwd, args) {
  try {
    const input = args._ && args._[1] ? args._[1] : (args.input || 'lint-results.json');
    const outFile = args.output || 'analysis-report.md';
    const format = (args.format || 'markdown').toLowerCase();

    const file = path.isAbsolute(input) ? input : path.join(cwd, input);
    const raw = fs.readFileSync(file, 'utf8');
    const json = JSON.parse(raw);
    const cfg = readProjectConfig({ getFilename: () => path.join(cwd, 'placeholder.js'), getCwd: () => cwd });
    let categories = categorizeViolations(json, cfg);
    categories = attachDomainContext(categories, cfg);
    const effort = estimateEffort(categories);

    const topFiles = numArg(args['top-files'] || args.topFiles, 10);
    const minCount = numArg(args['min-count'] || args.minCount, 1);
    const maxExamples = numArg(args['max-examples'] || args.maxExamples, 5);

    const outPath = path.join(cwd, outFile);
    if (format === 'markdown') {
      writeAnalysisReport(outPath, { categories, effort, cfg, topFiles, minCount, maxExamples });
    } else if (format === 'json') {
      fs.writeFileSync(outPath, JSON.stringify({ categories, effort }, null, 2) + '\n');
    } else if (format === 'html') {
      const md = writeAnalysisReport(null, { categories, effort, cfg, returnString: true });
      const htmlChars = { '&':'&amp;','<':'&lt;','>':'&gt;' };
      const escaped = md.replace(/[&<>]/g, s => htmlChars[s]);
      const html = `<!doctype html><meta charset="utf-8"><title>Analysis Report</title><pre>${escaped}</pre>`;
      fs.writeFileSync(outPath, html);
    }
    return 0;
  } catch (e) {
    console.error(`analyze failed: ${e && e.message}`);
    return 1;
  }
}

module.exports = { analyzeCommand };