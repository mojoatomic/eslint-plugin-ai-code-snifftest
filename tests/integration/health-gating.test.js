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

  it('passes gate when score equals threshold (>= semantics)', function () {
    const cwd = mkTmp();
    // exec=1000, structural=3 → overall=70
    const cats = { magicNumbers: [], complexity: Array.from({length:3},()=>({})), domainTerms: [], architecture: [], counts: {} };
    const base = { categories: cats, effort: { byCategory: {} }, lines: { physical: 1000, executable: 1000 }, meta: {} };
    const curr = { categories: cats, effort: { byCategory: {} }, lines: { physical: 1000, executable: 1000 }, meta: {} };
    const cfg = { ratchet: { health: { enabled: true, gateOn: 'overall', minOverall: 70 } } };
    const res = runRatchet(cwd, base, curr, { AI_SNIFFTEST_CONFIG_JSON: JSON.stringify(cfg) });
    assert.strictEqual(res.code, 0);
  });

  it('respects gateOn: passes with structural gate, fails with semantic gate', function () {
    const cwd = mkTmp();
    // structural=1 (score=90), semantic=5 (score=50), overall=6 (score=40)
    const cats = { magicNumbers: Array.from({length:5},()=>({})), complexity: Array.from({length:1},()=>({})), domainTerms: [], architecture: [], counts: {} };
    const base = { categories: cats, effort: { byCategory: {} }, lines: { physical: 1000, executable: 1000 }, meta: {} };
    const curr = { categories: cats, effort: { byCategory: {} }, lines: { physical: 1000, executable: 1000 }, meta: {} };
    const cfgStruct = { ratchet: { health: { enabled: true, gateOn: 'structural', minOverall: 90 } } };
    const cfgSem = { ratchet: { health: { enabled: true, gateOn: 'semantic', minOverall: 90 } } };
    const resStruct = runRatchet(cwd, base, curr, { AI_SNIFFTEST_CONFIG_JSON: JSON.stringify(cfgStruct) });
    const resSem = runRatchet(cwd, base, curr, { AI_SNIFFTEST_CONFIG_JSON: JSON.stringify(cfgSem) });
    assert.strictEqual(resStruct.code, 0);
    assert.ok(resSem.out.includes('HEALTH-GATE FAIL'));
  });

  it('applies intentOverrides when intent=refactoring', function () {
    const cwd = mkTmp();
    const cats = { magicNumbers: [], complexity: Array.from({length:3},()=>({})), domainTerms: [], architecture: [], counts: {} }; // overall=70
    const base = { categories: cats, effort: { byCategory: {} }, lines: { physical: 1000, executable: 1000 }, meta: {} };
    const curr = { categories: cats, effort: { byCategory: {} }, lines: { physical: 1000, executable: 1000 }, meta: {} };
    const cfg = { ratchet: { health: { enabled: true, gateOn: 'overall', minOverall: 80, intentOverrides: { refactoring: { minOverall: 60 } } } } };
    // Without intent override → fail
    const res1 = runRatchet(cwd, base, curr, { AI_SNIFFTEST_CONFIG_JSON: JSON.stringify(cfg) });
    assert.ok(res1.out.includes('HEALTH-GATE FAIL'));
    // With intent=refactoring → pass
    const env2 = { AI_SNIFFTEST_CONFIG_JSON: JSON.stringify(cfg) };
    // pass extra arg via environment by setting AI_SNIFFTEST_ARGS? Not supported; append to argv instead
    // We call node directly including --intent=refactoring by modifying runRatchet here
    const b = path.join(cwd, 'baseline.json');
    const c = path.join(cwd, 'current.json');
    writeJson(b, base);
    writeJson(c, curr);
    try {
      const out = cp.execFileSync(process.execPath, [path.join(process.cwd(), 'scripts/ratchet.js'), `--baseline=${b}`, `--current=${c}`, '--intent=refactoring'], { cwd, env: { ...process.env, ...env2 }, stdio: 'pipe' });
      assert.strictEqual(String(out).includes('HEALTH-GATE FAIL'), false);
    } catch (e) {
      assert.fail('expected pass with intent override');
    }
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

  it('bypasses gate via commit token in latest commit message', function () {
    const cwd = mkTmp();
    // Keep deltas=0
    const cats = { magicNumbers: Array.from({length:20},()=>({})), complexity: [], domainTerms: [], architecture: [], counts: {} }; // semantic heavy → low score
    const base = { categories: cats, effort: { byCategory: {} }, lines: { physical: 1000, executable: 1000 }, meta: {} };
    const curr = { categories: cats, effort: { byCategory: {} }, lines: { physical: 1000, executable: 1000 }, meta: {} };
    // Initialize a git repo and commit with bypass token
    cp.execSync('git init', { cwd });
    fs.writeFileSync(path.join(cwd, 'tmp.txt'), 'x');
    cp.execSync('git add .', { cwd });
    cp.execSync("git -c user.email=test@example.com -c user.name='Test' commit -m '[health-bypass] demo'", { cwd });
    const cfg = { ratchet: { health: { enabled: true, gateOn: 'semantic', minOverall: 90, bypass: { commitToken: '[health-bypass]' } } } };
    const res = runRatchet(cwd, base, curr, { AI_SNIFFTEST_CONFIG_JSON: JSON.stringify(cfg) });
    assert.strictEqual(res.code, 0);
  });
});
