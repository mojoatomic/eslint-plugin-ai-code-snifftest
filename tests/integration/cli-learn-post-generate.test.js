/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function runInteractiveLearnAndGenerate(tmpDir, extraArgs = []) {
  return new Promise((resolve, reject) => {
    const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
    const env = { ...process.env, SKIP_AI_REQUIREMENTS: '1' };
    const child = spawn('node', [cliPath, 'learn', '--interactive', '--sample=60', '--no-cache', ...extraArgs], {
      cwd: tmpDir,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    // Feed a bunch of newlines to accept defaults across prompts, including the new generate prompt
    let remaining = 14;
    const iv = setInterval(() => {
      if (remaining <= 0) {
        clearInterval(iv);
        child.stdin.end();
        return;
      }
      child.stdin.write('\n');
      remaining -= 1;
    }, 80);

    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));

    setTimeout(() => { try { child.kill(); } catch (e) { /* ignore */ } reject(new Error('timeout')); }, 30000);
  });
}

describe('CLI learn interactive post-generation prompt', function () {
  this.timeout(35000);

  it('offers and generates AGENTS.md + ESLint when user accepts default', async function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-learn-gen-'));
    // Create some basic JS files to ensure scanner finds content
    fs.writeFileSync(path.join(tmp, 'index.js'), 'const x = 1; function f(){ return x; }\n');

    const res = await runInteractiveLearnAndGenerate(tmp);
    assert.strictEqual(res.code, 0, res.stderr);
    assert.ok(fs.existsSync(path.join(tmp, '.ai-coding-guide.json')));
    assert.ok(fs.existsSync(path.join(tmp, 'AGENTS.md')));
    assert.ok(fs.existsSync(path.join(tmp, 'eslint.config.mjs')));
  });
});
