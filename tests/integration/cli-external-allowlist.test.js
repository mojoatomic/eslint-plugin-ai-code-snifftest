/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

describe('CLI --external with --allowlist', function () {
  it('writes allowlist into .ai-coding-guide.json', function () {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-allow-'));
    const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
    const env = { ...process.env, FORCE_AI_CONFIG: '1', FORCE_ESLINT_CONFIG: '1', SKIP_AI_REQUIREMENTS: '1', NODE_ENV: 'test' };
    execFileSync('node', [cliPath, 'init', '--primary=general', '--yes', '--external', '--allowlist=^@ai-constants/med,^eslint-constants-'], { cwd: tempDir, env, stdio: 'pipe' });
    const cfg = JSON.parse(fs.readFileSync(path.join(tempDir, '.ai-coding-guide.json'), 'utf8'));
    assert.ok(Array.isArray(cfg.externalConstantsAllowlist));
    assert.ok(cfg.externalConstantsAllowlist.includes('^@ai-constants/med'));
    assert.ok(cfg.externalConstantsAllowlist.includes('^eslint-constants-'));
  });
});