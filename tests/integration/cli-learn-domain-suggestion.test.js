/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function runInteractiveLearnAcceptAll(tmpDir) {
  return new Promise((resolve, reject) => {
    const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
    const env = { ...process.env, SKIP_AI_REQUIREMENTS: '1', FORCE_AI_CONFIG: '1' };
    const child = spawn('node', [cliPath, 'learn', '--interactive', '--sample=40', '--no-cache'], { cwd: tmpDir, env, stdio: ['pipe','pipe','pipe'] });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    // Press Enter many times to accept defaults, including domain suggestion
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

describe('learn interactive domain suggestion', function () {
  this.timeout(35000);

  it('suggests and applies inferred domain when accepted', async function () {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-learn-suggest-domain-'));
    // Ensure project suggests dev-tools
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'eslint-plugin-xyz' }, null, 2));
    // Add minimal code so scan runs
    fs.writeFileSync(path.join(tempDir, 'index.js'), 'const x=1; function f(){return x;}\n');

    const res = await runInteractiveLearnAcceptAll(tempDir);
    assert.strictEqual(res.code, 0, res.stderr);

    const cfg = JSON.parse(fs.readFileSync(path.join(tempDir, '.ai-coding-guide.json'), 'utf8'));
    assert.strictEqual(cfg.domains.primary, 'dev-tools');
    assert.ok(Array.isArray(cfg.domainPriority) && cfg.domainPriority[0] === 'dev-tools');
  });
});
