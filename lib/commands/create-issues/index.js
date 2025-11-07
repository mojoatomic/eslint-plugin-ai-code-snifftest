'use strict';

const path = require('path');
const fs = require('fs');
const { generateIssues, generateInstructions } = require('./markdown');

function createIssuesCommand(cwd, args) {
  try {
    const input = args._ && args._[1] ? args._[1] : (args.input || 'lint-results.json');
    const outDir = args.output || 'issues';
    const format = (args.format || 'markdown').toLowerCase();
    const includeCmd = (args['include-commands'] || 'github-cli').toLowerCase();

    const file = path.isAbsolute(input) ? input : path.join(cwd, input);
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));

    // We reuse the analysis categorizer logic to decide categories later.
    if (format !== 'markdown' && format !== 'json') {
      throw new Error(`Unsupported format: ${format}`);
    }

    fs.mkdirSync(path.join(cwd, outDir), { recursive: true });
    generateIssues(cwd, outDir, json, { format });
    generateInstructions(cwd, outDir, { includeCmd });
    return 0;
  } catch (e) {
    console.error(`create-issues failed: ${e && e.message}`);
    return 1;
  }
}

module.exports = { createIssuesCommand };