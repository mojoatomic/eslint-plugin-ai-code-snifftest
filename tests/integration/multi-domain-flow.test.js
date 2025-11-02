/* eslint-env mocha */
/* global describe, it */
"use strict";

const assert = require('assert');

describe('integration: multi-domain flow', function () {
  it('plugin loads and exposes rules', function () {
    const plugin = require('../../lib');
    assert.ok(plugin && plugin.rules && Object.keys(plugin.rules).length > 0);
  });
});