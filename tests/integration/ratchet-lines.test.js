/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cp = require('child_process');

function mkTmp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ratchet-'));
  return dir;
}

describe('ratchet Lines output', function () {
  it('prints Lines and Assessment on FAIL', function () {
    const cwd = mkTmp();

    const baseline = {
      categories: { magicNumbers: [], complexity: [], domainTerms: [], architecture: [], counts: { errors: 0, warnings: 0, autoFixable: 0 } },
      effort: { byCategory: { magicNumbers: 0, complexity: 0, domainTerms: 0, architecture: 0 } },
      lines: { physical: 100, executable: 80, comments: 20, commentRatio: 0.2 },
      meta: { lineCountMode: 'executable' }
    };
    const current = {
      categories: { magicNumbers: [], complexity: [{}], domainTerms: [], architecture: [], counts: { errors: 0, warnings: 0, autoFixable: 0 } },
      effort: { byCategory: { magicNumbers: 0, complexity: 1, domainTerms: 0, architecture: 0 } },
      lines: { physical: 120, executable: 70, comments: 50, commentRatio: 0.416667 },
      meta: { lineCountMode: 'executable' }
    };
    const b = path.join(cwd, 'baseline.json');
    const c = path.join(cwd, 'current.json');
    fs.writeFileSync(b, JSON.stringify(baseline));
    fs.writeFileSync(c, JSON.stringify(current));

    try {
      cp.execFileSync(process.execPath, [path.join(process.cwd(), 'scripts/ratchet.js'), `--baseline=${b}`, `--current=${c}`], { cwd, stdio: 'pipe' });
      assert.fail('expected ratchet to fail');
    } catch (e) {
      const out = String(e.stdout || '') + String(e.stderr || '');
      assert.ok(out.includes('[ratchet] FAIL'));
      assert.ok(out.includes('Lines (informational)'));
      assert.ok(out.includes('Assessment:'));
    }
  });
});
