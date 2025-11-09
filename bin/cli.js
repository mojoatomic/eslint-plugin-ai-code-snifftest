#!/usr/bin/env node
'use strict';

const path = require('path');

// Commands
const { scaffoldCommand } = require(path.join(__dirname, '..', 'lib', 'commands', 'scaffold'));
const { initCommand, initInteractiveCommand } = require(path.join(__dirname, '..', 'lib', 'commands', 'init'));
const { learnCommand } = require(path.join(__dirname, '..', 'lib', 'commands', 'learn'));
const { setupCommand } = require(path.join(__dirname, '..', 'lib', 'commands', 'setup'));
const { analyzeCommand } = require(path.join(__dirname, '..', 'lib', 'commands', 'analyze'));
const { planCommand } = require(path.join(__dirname, '..', 'lib', 'commands', 'plan'));
const { createIssuesCommand } = require(path.join(__dirname, '..', 'lib', 'commands', 'create-issues'));

// Utilities
const { parseArgs } = require(path.join(__dirname, '..', 'lib', 'utils', 'args-parser'));
const { usage } = require(path.join(__dirname, '..', 'lib', 'utils', 'cli-help'));
const { checkRequirements } = require(path.join(__dirname, '..', 'lib', 'utils', 'requirements'));

// ===== Helpers to reduce main() complexity =====
function shouldInteractiveInit(args) {
  return !args.primary && (process.stdin.isTTY || process.env.FORCE_CLI_INTERACTIVE);
}

function runAsync(cmdPromise) {
  Promise.resolve(cmdPromise).then((code)=>{ process.exitCode = code; });
}

function requireCheck() {
  if (!checkRequirements(process.cwd())) { process.exitCode = 1; return false; }
  return true;
}

function dispatch(cwd, cmd, args) {
  if (cmd === 'init') {
    if (!requireCheck()) return;
    if (shouldInteractiveInit(args)) return runAsync(initInteractiveCommand(cwd, args));
    process.exitCode = initCommand(cwd, args); return;
  }
  if (cmd === 'learn') { if (!requireCheck()) return; return runAsync(learnCommand(cwd, args)); }
  if (cmd === 'setup') { if (!requireCheck()) return; return runAsync(setupCommand(cwd, args)); }
  if (cmd === 'analyze') return runAsync(analyzeCommand(cwd, args));
  if (cmd === 'plan') return runAsync(planCommand(cwd, args));
  if (cmd === 'create-issues') return runAsync(createIssuesCommand(cwd, args));
  if (cmd === 'scaffold' || cmd === 'create-constants') {
    const dom = args._[1];
    const outDir = args.dir || args.out;
    process.exitCode = scaffoldCommand(cwd, dom, outDir); return;
  }
  usage();
}

function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
  const cwd = process.cwd();
  dispatch(cwd, cmd, args);
}

main();
