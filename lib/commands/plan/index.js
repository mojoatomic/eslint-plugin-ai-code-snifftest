'use strict';

const fs = require('fs');
const path = require('path');
const { readProjectConfig } = require(path.join(__dirname, '..', '..', 'utils', 'project-config'));
const { categorizeViolations } = require('../analyze/categorizer');
const { createPhases } = require('./phaser');
const { writeRoadmap } = require('./roadmap');

function planCommand(cwd, args) {
  try {
    const input = args._ && args._[1] ? args._[1] : (args.input || 'lint-results.json');
    const outFile = args.output || 'FIXES-ROADMAP.md';
    const phasesN = args.phases ? Number(args.phases) : 4;
    const team = args['team-size'] ? Number(args['team-size']) : 1;

    const file = path.isAbsolute(input) ? input : path.join(cwd, input);
    const raw = fs.readFileSync(file, 'utf8');
    const json = JSON.parse(raw);

    const cfg = readProjectConfig({ getFilename: () => path.join(cwd, 'placeholder.js'), getCwd: () => cwd });
    const categories = categorizeViolations(json, cfg);
    const phases = createPhases(categories, { phases: phasesN, teamSize: team, cfg });
    writeRoadmap(path.join(cwd, outFile), { phases, categories, cfg });
    return 0;
  } catch (e) {
    console.error(`plan failed: ${e && e.message}`);
    return 1;
  }
}

module.exports = { planCommand };