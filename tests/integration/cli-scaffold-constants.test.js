/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

describe('CLI scaffold', function () {
  it('creates an external constants package skeleton', function () {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-scaf-'));
    const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
    const env = { ...process.env, FORCE_AI_CONFIG: '1', FORCE_ESLINT_CONFIG: '1', SKIP_AI_REQUIREMENTS: '1', NODE_ENV: 'test' };
    execFileSync('node', [cliPath, 'scaffold', 'my-domain', '--dir=./pkg'], { cwd: tempDir, env, stdio: 'pipe' });
    const idx = fs.readFileSync(path.join(tempDir, 'pkg', 'index.js'), 'utf8');
    assert.match(idx, /domain: 'my-domain'/);
    const pkg = JSON.parse(fs.readFileSync(path.join(tempDir, 'pkg', 'package.json'), 'utf8'));
    assert.strictEqual(pkg.main, 'index.js');
  });
});