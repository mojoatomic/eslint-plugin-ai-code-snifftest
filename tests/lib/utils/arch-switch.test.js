/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const { shouldEnableArchitecture } = require('../../../lib/utils/arch-switch');

describe('utils/arch-switch.shouldEnableArchitecture', function () {
  it('enables by default when no flags provided', function () {
    assert.strictEqual(shouldEnableArchitecture({}), true);
    assert.strictEqual(shouldEnableArchitecture(), true);
  });

  it('disables when --no-arch present', function () {
    assert.strictEqual(shouldEnableArchitecture({ 'no-arch': true }), false);
    assert.strictEqual(shouldEnableArchitecture({ 'no-arch': 'true' }), false);
    assert.strictEqual(shouldEnableArchitecture({ 'no-arch': '1' }), false);
    assert.strictEqual(shouldEnableArchitecture({ 'no-arch': 'yes' }), false);
  });

  it('disables when --arch=false provided', function () {
    assert.strictEqual(shouldEnableArchitecture({ arch: false }), false);
    assert.strictEqual(shouldEnableArchitecture({ arch: 'false' }), false);
    assert.strictEqual(shouldEnableArchitecture({ arch: '0' }), false);
    assert.strictEqual(shouldEnableArchitecture({ arch: 'off' }), false);
  });

  it('enables when --arch or --arch=true provided', function () {
    assert.strictEqual(shouldEnableArchitecture({ arch: true }), true);
    assert.strictEqual(shouldEnableArchitecture({ arch: 'true' }), true);
    assert.strictEqual(shouldEnableArchitecture({ arch: '1' }), true);
    assert.strictEqual(shouldEnableArchitecture({ arch: 'on' }), true);
  });

  it('no-arch overrides arch=true if both present', function () {
    assert.strictEqual(shouldEnableArchitecture({ 'no-arch': true, arch: true }), false);
    assert.strictEqual(shouldEnableArchitecture({ 'no-arch': '1', arch: '1' }), false);
  });
});