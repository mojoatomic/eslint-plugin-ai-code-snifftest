/* eslint-env mocha */
/* global describe, it */
"use strict";

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

function runCliInit(tmpDir, primary, extraArgs = []) {
  const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
const env = { ...process.env, FORCE_AI_CONFIG: '1', FORCE_ESLINT_CONFIG: '1', SKIP_AI_REQUIREMENTS: '1', NODE_ENV: 'test' };
  execFileSync('node', [cliPath, 'init', `--primary=${primary}`, '--yes', '--md', '--cursor', '--agents', '--eslint', ...extraArgs], {
    cwd: tmpDir,
    env,
    stdio: 'pipe'
  });
}

describe('CLI init across sample domains', function () {
  it('generates guide sections for geometry', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-geom-'));
    runCliInit(tmp, 'geometry');
    const guide = fs.readFileSync(path.join(tmp, '.ai-coding-guide.md'), 'utf8');
    assert.match(guide, /Primary domain: geometry/);
    assert.match(guide, /## Domain: geometry/);
    assert.match(guide, /Ambiguity and Disambiguation/);
    assert.match(guide, /Active-Domain Precedence/);
  });

  it('generates guide sections for physics', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-phys-'));
    runCliInit(tmp, 'physics');
    const guide = fs.readFileSync(path.join(tmp, '.ai-coding-guide.md'), 'utf8');
    assert.match(guide, /Primary domain: physics/);
    assert.match(guide, /## Domain: physics/);
  });

  it('generates guide sections for astronomy with additional domains', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-astro-'));
    runCliInit(tmp, 'astronomy', ['--additional=geometry,math']);
    const guide = fs.readFileSync(path.join(tmp, '.ai-coding-guide.md'), 'utf8');
    assert.match(guide, /Primary domain: astronomy/);
    assert.match(guide, /## Domain: astronomy/);
    assert.match(guide, /## Domain: geometry/);
  });
});