/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

describe('CLI init consumes fingerprint', function () {
  it('merges .ai-constants/project-fingerprint.js into config', function () {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-init-fp-'));
    const dir = path.join(tempDir, '.ai-constants');
    fs.mkdirSync(dir, { recursive: true });
    const fpFile = path.join(dir, 'project-fingerprint.js');
    fs.writeFileSync(fpFile, 'module.exports = { constants: [ { value: 365.25, name: \'TROPICAL_YEAR_DAYS\', domain: \'astronomy\' } ] };\n');

    const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
    const env = { ...process.env, SKIP_AI_REQUIREMENTS: '1', FORCE_AI_CONFIG: '1' };
    execFileSync('node', [cliPath, 'init', '--primary=general'], { cwd: tempDir, env, stdio: 'pipe' });

    const cfgPath = path.join(tempDir, '.ai-coding-guide.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    assert.strictEqual(cfg.constantResolution['365.25'], 'astronomy');
    // fingerprint domain should be added to additional domains
    assert.ok(Array.isArray(cfg.domains.additional));
    assert.ok(cfg.domains.additional.includes('astronomy'));
  });
});
