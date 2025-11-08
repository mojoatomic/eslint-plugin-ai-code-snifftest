/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

function runCliInit(tmpDir, args = []) {
  const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
const env = { ...process.env, FORCE_AI_CONFIG: '1', FORCE_ESLINT_CONFIG: '1', SKIP_AI_REQUIREMENTS: '1' };
  execFileSync('node', [cliPath, 'init', '--primary=astronomy', '--yes', '--md', '--cursor', ...args], {
    cwd: tmpDir,
    env,
    stdio: 'pipe'
  });
}

describe('CLI init guide content', function () {
  it('writes AGENTS.md with domain sections (guide removed)', function () {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-guide-'));
    runCliInit(tempDir);
    // Guide should NOT be present anymore
    assert.strictEqual(fs.existsSync(path.join(tempDir, '.ai-coding-guide.md')), false);
    // Validate AGENTS.md includes core sections
    const agents = fs.readFileSync(path.join(tempDir, 'AGENTS.md'), 'utf8');
    assert.match(agents, /## Domain:/);
    assert.match(agents, /## Ambiguity Tactics/);
  });
});
