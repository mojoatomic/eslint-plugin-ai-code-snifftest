/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

function runCliSetup(tmpDir, args = []) {
  const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
  const env = { ...process.env, FORCE_AI_CONFIG: '1', FORCE_ESLINT_CONFIG: '1', SKIP_AI_REQUIREMENTS: '1', NODE_ENV: 'test' };
  execFileSync('node', [cliPath, 'setup', '--yes', '--primary=dev-tools', ...args], {
    cwd: tmpDir,
    env,
    stdio: 'pipe'
  });
}

describe('setup persists architecture and domainPriority into JSON', function () {
  it('writes architecture and domainPriority to .ai-coding-guide.json', function () {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-setup-arch-json-'));
    runCliSetup(tempDir);
    const cfg = JSON.parse(fs.readFileSync(path.join(tempDir, '.ai-coding-guide.json'), 'utf8'));
    assert.ok(cfg.architecture, 'architecture section should exist');
    assert.ok(cfg.architecture.maxFileLength, 'architecture.maxFileLength should exist');
    assert.ok(Array.isArray(cfg.domainPriority) && cfg.domainPriority.length > 0, 'domainPriority should be populated');
  });
});
