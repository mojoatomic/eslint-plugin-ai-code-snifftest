/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { readProjectConfig } = require('../../../lib/utils/project-config');

function withTempConfig(obj, fn) {
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'cfg-'));
  const file = path.join(dir, '.ai-coding-guide.json');
  fs.writeFileSync(file, JSON.stringify(obj), 'utf8');
  const context = {
    getFilename() { return path.join(dir, 'src', 'file.js'); },
    getCwd() { return dir; }
  };
  fs.mkdirSync(path.join(dir, 'src'));
  try { return fn(context); } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {
      // ignore
    }
  }
}

describe('project-config multi-domain', function () {
  it('derives domainPriority from domains.primary/additional', function () {
    const cfg = {
      domains: { primary: 'astronomy', additional: ['geometry','math'] }
    };
    const out = withTempConfig(cfg, (ctx) => readProjectConfig(ctx));
    assert.deepStrictEqual(out.domainPriority, ['astronomy','geometry','math']);
  });

  it('respects explicit domainPriority and merges with primary/additional', function () {
    const cfg = {
      domains: { primary: 'astronomy', additional: ['geometry'] },
      domainPriority: ['math','units']
    };
    const out = withTempConfig(cfg, (ctx) => readProjectConfig(ctx));
    assert.deepStrictEqual(out.domainPriority, ['astronomy','geometry','math','units']);
  });

  it('keeps constantResolution object', function () {
    const cfg = { constantResolution: { '360': 'geometry' } };
    const out = withTempConfig(cfg, (ctx) => readProjectConfig(ctx));
    assert.strictEqual(out.constantResolution['360'], 'geometry');
  });
});