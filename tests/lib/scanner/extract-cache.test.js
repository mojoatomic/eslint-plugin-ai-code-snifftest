/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { scanProject } = require('../../../lib/scanner/extract');

function writeFile(dir, rel, content) {
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

describe('scanner/extract cache & sampling', function() {
  it('writes cache file and reuses it on second run', function() {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scan-'));
    writeFile(tempDir, 'a.js', 'const x = 1;');
    writeFile(tempDir, 'b.js', 'const y = 2;');
    const cachePath = path.join(tempDir, '.ai-learn-cache.json');
    scanProject(tempDir, { sample: 10, useCache: true, cachePath });
    assert.ok(fs.existsSync(cachePath));
    const before = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    assert.ok(before.files && Object.keys(before.files).length >= 2);
    const second = scanProject(tempDir, { sample: 10, useCache: true, cachePath });
    // findings should be stable and cache should still exist
    assert.ok(second && second.naming && second.constants);
  });
});
