#!/usr/bin/env node
'use strict';

const path = require('path');
const { checkRequirements } = require(path.resolve(__dirname, '..', 'lib', 'utils', 'requirements.js'));
const { initCommand } = require(path.resolve(__dirname, '..', 'lib', 'commands', 'init.js'));
const { learnCommand } = require(path.resolve(__dirname, '..', 'lib', 'commands', 'learn.js'));
const { scaffoldCommand } = require(path.resolve(__dirname, '..', 'lib', 'commands', 'scaffold.js'));

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.replace(/^--/, '').split('=');
      out[k] = v === undefined ? true : v;
    } else {
      out._.push(a);
    }
  }
  return out;
}

function usage() {
  console.log(`Usage:
  eslint-plugin-ai-code-snifftest init [--primary=<domain>] [--additional=a,b,c]
  eslint-plugin-ai-code-snifftest learn [--strict|--permissive|--interactive] [--fingerprint] [--accept-defaults]
  eslint-plugin-ai-code-snifftest scaffold <domain> [--dir=path]
`);
}

async function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
  const cwd = process.cwd();
  if (cmd === 'init') {
    if (!checkRequirements(cwd)) { process.exitCode = 1; return; }
    process.exitCode = await initCommand(cwd, args);
    return;
  }
  if (cmd === 'learn') {
    if (!checkRequirements(cwd, { requireEslint: false })) { process.exitCode = 1; return; }
    process.exitCode = await learnCommand(cwd, args);
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
main();