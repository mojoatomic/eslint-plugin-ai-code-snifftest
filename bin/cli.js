#!/usr/bin/env node
'use strict';

const path = require('path');

// Commands
const { scaffoldCommand } = require(path.join(__dirname, '..', 'lib', 'commands', 'scaffold'));
const { initCommand, initInteractiveCommand } = require(path.join(__dirname, '..', 'lib', 'commands', 'init'));
const { learnCommand } = require(path.join(__dirname, '..', 'lib', 'commands', 'learn'));
const { setupCommand } = require(path.join(__dirname, '..', 'lib', 'commands', 'setup'));

// Utilities
const { parseArgs } = require(path.join(__dirname, '..', 'lib', 'utils', 'args-parser'));
const { usage } = require(path.join(__dirname, '..', 'lib', 'utils', 'cli-help'));
const { checkRequirements } = require(path.join(__dirname, '..', 'lib', 'utils', 'requirements'));

function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
  const cwd = process.cwd();
  if (cmd === 'init') {
    if (!checkRequirements(process.cwd())) { process.exitCode = 1; return; }
    if (!args.primary && (process.stdin.isTTY || process.env.FORCE_CLI_INTERACTIVE)) {
      initInteractiveCommand(cwd, args).then((code)=>{ process.exitCode = code; });
      return;
    }
    process.exitCode = initCommand(cwd, args);
    return;
  }
  if (cmd === 'learn') {
    if (!checkRequirements(process.cwd())) { process.exitCode = 1; return; }
    Promise.resolve(learnCommand(cwd, args)).then((code)=>{ process.exitCode = code; });
    return;
  }
  if (cmd === 'setup') {
    if (!checkRequirements(process.cwd())) { process.exitCode = 1; return; }
    Promise.resolve(setupCommand(cwd, args)).then((code)=>{ process.exitCode = code; });
    return;
  }
  if (cmd === 'scaffold' || cmd === 'create-constants') {
    const dom = args._[1];
    const outDir = args.dir || args.out;
    process.exitCode = scaffoldCommand(cwd, dom, outDir);
    return;
  }
  usage();
}

main();
