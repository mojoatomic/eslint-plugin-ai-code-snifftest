/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const { computeHealth } = require('../../../lib/utils/health');

function summary({ exec = 1000, magicNumbers = 0, complexity = 0, domainTerms = 0, architecture = 0 } = {}) {
  return {
    magicNumbers,
    complexity,
    domainTerms,
    architecture,
    lines: { executable: exec }
  };
}

describe('utils/health.computeHealth', function () {
  it('returns 100s when there are no violations', function () {
    const s = summary({ exec: 1000 });
    const h = computeHealth(s);
    assert.deepStrictEqual(h, { overall: 100, structural: 100, semantic: 100 });
  });

  it('drops to 0 when perK density is 10 (1000 exec, 10 total)', function () {
    const s = summary({ exec: 1000, complexity: 5, architecture: 5 });
    const h = computeHealth(s);
    assert.strictEqual(h.overall, 0);
    assert.strictEqual(h.structural, 0);
    assert.strictEqual(h.semantic, 100);
  });

  it('computes expected rounding at partial densities', function () {
    // 2000 exec LOC, total=5 → perK=2.5 → score=100 - 25 = 75
    const s = summary({ exec: 2000, magicNumbers: 2, complexity: 3 });
    const h = computeHealth(s);
    assert.strictEqual(h.overall, 75);
    // structural=3, perK=1.5 → 85
    assert.strictEqual(h.structural, 85);
    // semantic=2, perK=1.0 → 90
    assert.strictEqual(h.semantic, 90);
  });
});