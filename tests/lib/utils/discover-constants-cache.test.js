/* eslint-env mocha */
/* global describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { discoverNpmPackages } = require('../../../lib/utils/discover-constants');

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

describe('discover-constants (env/cache behavior)', function () {
  let dir;
  let prevNoCache;

  beforeEach(function () {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disc-cache-dual-'));
    write(path.join(dir, 'package.json'), JSON.stringify({ dependencies: { } }, null, 2));
    prevNoCache = process.env.AI_CONSTANTS_NO_CACHE;
    delete process.env.AI_CONSTANTS_NO_CACHE;
  });

  afterEach(function () {
    if (prevNoCache === undefined) delete process.env.AI_CONSTANTS_NO_CACHE; else process.env.AI_CONSTANTS_NO_CACHE = prevNoCache;
  });

  it('returns cached object by reference when AI_CONSTANTS_NO_CACHE is not set', function () {
    const a = discoverNpmPackages(dir, []);
    const b = discoverNpmPackages(dir, []);
    assert.strictEqual(a, b, 'expected second call to return same cached object reference');
  });

  it('recomputes when AI_CONSTANTS_NO_CACHE is set', function () {
    const a = discoverNpmPackages(dir, []);
    process.env.AI_CONSTANTS_NO_CACHE = '1';
    const b = discoverNpmPackages(dir, []);
    assert.notStrictEqual(a, b, 'expected second call to recompute and return a new object');
  });
});
