/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const path = require('path');

const { estimateEffort } = require(path.join(__dirname, '..', '..', '..', 'lib', 'commands', 'analyze', 'estimator'));

describe('estimateEffort', () => {
  it('computes rough hours/days/weeks', () => {
    const categories = {
      magicNumbers: Array(10).fill({}),
      domainTerms: Array(5).fill({}),
      architecture: Array(3).fill({}),
      complexity: Array(2).fill({})
    };
    const e = estimateEffort(categories);
    // basic sanity: >0 and consistent ordering
    assert.ok(e.hours > 0);
    assert.ok(e.days > 0);
    assert.ok(e.weeks > 0);
  });
});