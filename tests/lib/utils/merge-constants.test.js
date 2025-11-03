/* eslint-env mocha */
/* global describe, it */
"use strict";

const assert = require('assert');
const { mergeConstants } = require('../../../lib/utils/merge-constants');

describe('merge-constants', function () {
  it('applies precedence (builtin < npm < local < custom)', function () {
    const discovered = {
      builtin: { a: { domain: 'a', constants: [{ value: 10, name: 'TEN', description: '10' }], source: 'builtin' } },
      npm: { a: { domain: 'a', constants: [{ value: 10, name: 'TEN_NPM', description: '10 from npm' }], source: 'npm', package: 'pkg' } },
      local: { a: { domain: 'a', constants: [{ value: 10, name: 'TEN_LOCAL', description: '10 from local' }], source: 'local', file: 'a.js' } },
      custom: { a: { domain: 'a', constants: [{ value: 10, name: 'TEN_CUSTOM', description: '10 from custom' }], source: 'custom' } }
    };
    const merged = mergeConstants(discovered);
    assert.ok(merged.a);
    // last one wins for same value
    const last = merged.a.constants.find((c) => String(c.value) === '10');
    assert.strictEqual(last.name, 'TEN_CUSTOM');
    // sources tracked
    assert.ok(Array.isArray(merged.a.sources));
    assert.ok(merged.a.sources.length === 4);
  });

  it('merges terms additively', function () {
    const discovered = {
      builtin: { b: { domain: 'b', constants: [], terms: { entities: ['Entity1'] }, source: 'builtin' } },
      local: { b: { domain: 'b', constants: [], terms: { entities: ['Entity2'], properties: ['prop'] }, source: 'local' } }
    };
    const merged = mergeConstants(discovered);
    assert.deepStrictEqual(merged.b.terms.entities.sort(), ['Entity1','Entity2'].sort());
    assert.deepStrictEqual(merged.b.terms.properties, ['prop']);
  });
});