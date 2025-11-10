/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cp = require('child_process');

function mkTmp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'health-'));
  return dir;
}

function writeJson(p, obj) { fs.writeFileSync(p, JSON.stringify(obj)); }

function runRatchet(cwd, baseline, current, extraEnv = {}) {
  const b = path.join(cwd, 'baseline.json');
  const c = path.join(cwd, 'current.json');
  writeJson(b, baseline);
  writeJson(c, current);
  const env = { ...process.env, ...extraEnv };
  try {
    const out = cp.execFileSync(process.execPath, [path.join(process.cwd(), 'scripts/ratchet.js'), `--baseline=${b}`, `--current=${c}`], { cwd, env, stdio: 'pipe' });
    return { code: 0, out: String(out) };
  } catch (e) {
    return { code: e.status || 1, out: String(e.stdout || '') + String(e.stderr || '') };
  }
}

describe('health gating', function () {
  it('prints health telemetry (disabled by default)', function () {
    const cwd = mkTmp();
    const base = { categories: { magicNumbers: [], complexity: [], domainTerms: [], architecture: [], counts: {} }, effort: { byCategory: {} }, lines: { physical: 1000, executable: 1000 }, meta: {} };
    const curr = { categories: { magicNumbers: [], complexity: [], domainTerms: [], architecture: [], counts: {} }, effort: { byCategory: {} }, lines: { physical: 1000, executable: 1000 }, meta: {} };
    const res = runRatchet(cwd, base, curr);
    assert.ok(res.out.includes('[ratchet] Health (informational):'));
    assert.strictEqual(res.code, 0, 'should succeed when no deltas and gating disabled');
  });

  it('fails gate when enabled and below threshold', function () {
    const cwd = mkTmp();
    const base = { categories: { magicNumbers: [], complexity: [], domainTerms: [], architecture: [], counts: {} }, effort: { byCategory: {} }, lines: { physical: 1000, executable: 1000 }, meta: {} };
    // Current: exec=1000; total violations=20 → perK=20 → score≈0
    const curr = { categories: { magicNumbers: [], complexity: [{} ,{} ,{} ,{} ,{} ,{} ,{} ,{} ,{} ,{}], domainTerms: [], architecture: [{} ,{} ,{} ,{} ,{} ,{} ,{} ,{} ,{} ,{}], counts: {} }, effort: { byCategory: {} }, lines: { physical: 1000, executable: 1000 }, meta: {} };
    const cfg = { ratchet: { health: { enabled: true, gateOn: 'overall', minOverall: 70, failureMessage: 'Below threshold' } } };
    const res = runRatchet(cwd, base, curr, { AI_SNIFFTEST_CONFIG_JSON: JSON.stringify(cfg) });
    assert.ok(res.out.includes('HEALTH-GATE FAIL'));
  });

  it('bypasses gate when HEALTH_BYPASS=true', function () {
    const cwd = mkTmp();
    // Make baseline and current have same category counts so deltas=0 (avoid traditional ratchet failure)
    const catsEqual = { magicNumbers: [], complexity: Array.from({length:10},()=>({})), domainTerms: [], architecture: Array.from({length:10},()=>({})), counts: {} };
    const base = { categories: catsEqual, effort: { byCategory: {} }, lines: { physical: 1000, executable: 1000 }, meta: {} };
    const curr = { categories: catsEqual, effort: { byCategory: {} }, lines: { physical: 1000, executable: 1000 }, meta: {} };
    const cfg = { ratchet: { health: { enabled: true, gateOn: 'overall', minOverall: 70, failureMessage: 'Below threshold' } } };
    const res = runRatchet(cwd, base, curr, { AI_SNIFFTEST_CONFIG_JSON: JSON.stringify(cfg), HEALTH_BYPASS: 'true' });
    // Bypass active: gating not enforced; exit should be success since there are no deltas
    assert.strictEqual(res.code, 0);
  });
});
