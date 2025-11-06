'use strict';

const path = require('path');

async function setupCommand(cwd, args) {
  const { learnCommand } = require(path.join(__dirname, '..', 'learn'));
  const { initCommand } = require(path.join(__dirname, '..', 'init'));

  // 1) Learn phase (unless skipped)
  const skipLearn = !!(args['skip-learn'] || args.skipLearn);
  if (!skipLearn) {
    const learnArgs = { ...args };
    // If --yes provided, do a non-interactive strict apply
    if (args.yes) {
      learnArgs.strict = true;
      learnArgs.apply = true;
      delete learnArgs.interactive;
    } else {
      // Prefer interactive reconciliation when TTY
      learnArgs.interactive = true;
    }
    const code = await Promise.resolve(learnCommand(cwd, learnArgs));
    if (code !== 0) return code;
  }

  // 2) Init phase: generate everything by default (AGENTS.md + ESLint); cursor remains opt-in
  const initArgs = { ...args, yes: true };
  // Respect explicit opt-outs if user provided them
  // (init defaults already generate both; --no-agents/--no-eslint disable)
  const code2 = initCommand(cwd, initArgs);
  return code2;
}

module.exports = { setupCommand };