/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const path = require('path');

const { createPhases } = require(path.join(__dirname, '..', '..', '..', 'lib', 'commands', 'plan', 'phaser'));

describe('createPhases', () => {
  it('creates ordered phases with limits', () => {
    const cats = {
      magicNumbers: Array(150).fill({}),
      domainTerms: Array(250).fill({}),
      complexity: Array(60).fill({}),
      architecture: Array(300).fill({})
    };
    const phases = createPhases(cats, { phases: 4 });
    assert.strictEqual(phases.length, 4);
    assert.strictEqual(phases[0].name, 'Quick Wins');
    assert.ok(phases[0].items.length <= 100);
  });
});