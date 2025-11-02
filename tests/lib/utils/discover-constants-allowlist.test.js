/* eslint-env mocha */
/* global describe, it */
"use strict";

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { discoverConstants } = require('../../../lib/utils/discover-constants');

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

describe('discover-constants allowlist/cache', function () {
  it('reads allowlist from config and does not throw', function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disc-allow-'));
    write(path.join(dir, 'package.json'), JSON.stringify({ dependencies: { '@ai-constants/medical': '1.0.0', '@ai-constants/automotive': '1.0.0' } }, null, 2));
    write(path.join(dir, '.ai-coding-guide.json'), JSON.stringify({ externalConstantsAllowlist: ['^@ai-constants/med'] }, null, 2));
    const all = discoverConstants(dir);
    assert.ok(all && all.npm !== undefined);
  });

  it('caches npm discovery per package.json hash', function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disc-cache-'));
    write(path.join(dir, 'package.json'), JSON.stringify({ dependencies: {} }, null, 2));
    write(path.join(dir, '.ai-coding-guide.json'), JSON.stringify({ externalConstantsAllowlist: [] }, null, 2));
    const a = discoverConstants(dir);
    const b = discoverConstants(dir);
    assert.ok(a && b);
    write(path.join(dir, 'package.json'), JSON.stringify({ dependencies: { '@ai-constants/x': '1.0.0' } }, null, 2));
    const c = discoverConstants(dir);
    assert.ok(c);
  });
});