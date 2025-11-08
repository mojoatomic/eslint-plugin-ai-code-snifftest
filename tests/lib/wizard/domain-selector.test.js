/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');

describe('wizard/domain-selector.buildDomainMetadata', function () {
  it('returns sorted domain metadata with counts', function () {
    const { buildDomainMetadata } = require('../../../lib/wizard/domain-selector');
    const meta = buildDomainMetadata();
    assert.ok(Array.isArray(meta) && meta.length > 0);
    // Ensure shape
    const first = meta[0];
    assert.ok(first.name && typeof first.constantsCount === 'number');
    // Ensure sorted by constantsCount desc (or at least non-increasing)
    for (let i = 1; i < meta.length; i++) {
      assert.ok(meta[i - 1].constantsCount >= meta[i].constantsCount);
    }
  });
});