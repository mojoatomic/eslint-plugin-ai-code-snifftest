'use strict';

const fs = require('fs');
const path = require('path');
const { readProjectConfig } = require(path.join(__dirname, '..', '..', 'utils', 'project-config'));
const { categorizeViolations } = require('./categorizer');
const { estimateEffort } = require('./estimator');
const { writeAnalysisReport } = require('./reporter');

function analyzeCommand(cwd, args) {
  try {
    const input = args._ && args._[1] ? args._[1] : (args.input || 'lint-results.json');
    const outFile = args.output || 'analysis-report.md';
    const format = (args.format || 'markdown').toLowerCase();

    const file = path.isAbsolute(input) ? input : path.join(cwd, input);
    const raw = fs.readFileSync(file, 'utf8');
    const json = JSON.parse(raw);

    const cfg = readProjectConfig({ getFilename: () => path.join(cwd, 'placeholder.js'), getCwd: () => cwd });
    const categories = categorizeViolations(json, cfg);
    const effort = estimateEffort(categories);

    if (format === 'markdown') {
      writeAnalysisReport(path.join(cwd, outFile), { categories, effort, cfg });
    } else if (format === 'json') {
      fs.writeFileSync(path.join(cwd, outFile), JSON.stringify({ categories, effort }, null, 2) + '\n');
    } else if (format === 'html') {
      // Minimal HTML wrapper
      const md = writeAnalysisReport(null, { categories, effort, cfg, returnString: true });
      const html = `<!doctype html><meta charset="utf-8"><title>Analysis Report</title><pre>${md.replace(/[&<>]/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;' }[s]))}</pre>`;
      fs.writeFileSync(path.join(cwd, outFile), html);
    }
    return 0;
  } catch (e) {
    console.error(`analyze failed: ${e && e.message}`);
    return 1;
  }
}

module.exports = { analyzeCommand };