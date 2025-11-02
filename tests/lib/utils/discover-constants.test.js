/* eslint-env mocha */
/* global describe, it */
"use strict";

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  discoverConstants,
  loadBuiltinConstants,
  discoverLocalFiles,
  loadCustomConstants
} = require('../../../lib/utils/discover-constants');

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

describe('discover-constants', function () {
  it('loads builtin domains', function () {
    const builtins = loadBuiltinConstants();
    assert.ok(builtins);
    // expect some known builtins
    assert.ok(builtins.astronomy);
    assert.ok(builtins.physics);
  });

  it('discovers local .ai-constants files', function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disc-local-'));
    write(path.join(dir, '.ai-constants', 'internal.js'),
      "module.exports = { domain: 'internal-metrics', version: '1.0.0', constants: [{ value: 42, name: 'ANSWER', description: 'Forty-two' }], terms: { entities: ['Metric'] } };\n");
    const locals = discoverLocalFiles(dir);
    assert.ok(locals['internal-metrics']);
    assert.strictEqual(locals['internal-metrics'].constants[0].name, 'ANSWER');
  });

  it('loads custom constants from .ai-coding-guide.json', function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disc-cust-'));
    write(path.join(dir, '.ai-coding-guide.json'), JSON.stringify({
      customConstants: {
        custom: [{ value: 7, name: 'DAYS_IN_WEEK', description: 'Number of days in a week' }]
      }
    }, null, 2));
    const custom = loadCustomConstants(dir);
    assert.ok(custom.custom);
    assert.strictEqual(custom.custom.constants[0].name, 'DAYS_IN_WEEK');
  });

  it('composes discovered sets', function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disc-all-'));
    write(path.join(dir, '.ai-constants', 'x.js'),
      "exports.default = { domain: 'x', version: '1.0.0', constants: [{ value: 1, name: 'ONE', description: 'one' }] };\n");
    write(path.join(dir, '.ai-coding-guide.json'), JSON.stringify({
      customConstants: { y: [{ value: 2, name: 'TWO', description: 'two' }] }
    }, null, 2));
    const all = discoverConstants(dir);
    assert.ok(all.builtin);
    assert.ok(all.local.x);
    assert.ok(all.custom.y);
  });
});