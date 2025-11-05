/* eslint-env mocha */
/* global describe, it */
"use strict";

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

function runInteractiveInit(tmpDir) {
  return new Promise((resolve, reject) => {
    const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
    const env = { ...process.env, FORCE_AI_CONFIG: '1', FORCE_ESLINT_CONFIG: '1', SKIP_AI_REQUIREMENTS: '1', NODE_ENV: 'test', FORCE_CLI_INTERACTIVE: '1' };
    const child = spawn('node', [cliPath, 'init'], { cwd: tmpDir, env, stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    // Feed newlines to accept defaults for all prompts (staggered)
    let remaining = 8;
    const iv = setInterval(() => {
      if (remaining <= 0) {
        clearInterval(iv);
        child.stdin.end();
        return;
      }
      child.stdin.write('\n');
      remaining -= 1;
    }, 50);

    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`CLI exited with code ${code}: ${stderr}`));
      }
      resolve({ stdout, stderr });
    });
  });
}

describe('CLI init (interactive accept defaults)', function () {
  it('creates config and docs with default general domain', async function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-interactive-'));
    const { stdout } = await runInteractiveInit(tmp);
    // Ensure writes occurred
    assert.match(stdout, /Wrote .*\.ai-coding-guide\.json/);
    assert.match(stdout, /Wrote .*\.ai-coding-guide\.md/);
    // Validate generated files
    const guide = fs.readFileSync(path.join(tmp, '.ai-coding-guide.md'), 'utf8');
    assert.match(guide, /Primary domain: general/);
    const agents = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf8');
    assert.match(agents, /\*\*Domains\*\*: general/);
    const cursor = fs.readFileSync(path.join(tmp, '.cursorrules'), 'utf8');
    assert.match(cursor, /Primary domain: general/);
  });
});