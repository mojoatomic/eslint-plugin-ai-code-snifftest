/* eslint-env mocha */
/* global describe, it */
"use strict";

const assert = require('assert');
const {
  DOMAINS,
  isPhysicalConstant,
  hasScientificTerm,
  getDomainForValue,
  getDomainForName
} = require('../../../lib/constants');

describe('constants library', function () {
  it('exports domains', function () {
    assert.ok(DOMAINS);
    assert.ok(DOMAINS.astronomy);
    assert.ok(DOMAINS.units);
    assert.ok(DOMAINS.acoustics);
    assert.ok(DOMAINS.physics);
    assert.ok(DOMAINS.time);
    assert.ok(DOMAINS.math);
    assert.ok(DOMAINS.finance);
    assert.ok(DOMAINS.geometry);
    assert.ok(DOMAINS.statistics);
    assert.ok(DOMAINS.biology);
    assert.ok(DOMAINS.chemistry);
    assert.ok(DOMAINS.cs);
    assert.ok(DOMAINS.networking);
    assert.ok(DOMAINS.graphics);
    assert.ok(DOMAINS.geodesy);
  });

  it('detects physical constants', function () {
    assert.strictEqual(isPhysicalConstant(25.4), true);
    assert.strictEqual(isPhysicalConstant(440), true);
    assert.strictEqual(isPhysicalConstant(299792458), true);
    assert.strictEqual(isPhysicalConstant(86400), true);
    assert.strictEqual(isPhysicalConstant(3.14159), true);
    assert.strictEqual(isPhysicalConstant(252), true);
    assert.strictEqual(isPhysicalConstant(360), true);
    assert.strictEqual(isPhysicalConstant(1.96), true);
    assert.strictEqual(isPhysicalConstant(123.456), false);
  });

  it('detects scientific terms in names', function () {
    assert.strictEqual(hasScientificTerm('meanLongitude'), true);
    assert.strictEqual(hasScientificTerm('orbitalPeriod'), true);
    assert.strictEqual(hasScientificTerm('randomName'), false);
  });

  it('infers domain for values', function () {
    assert.strictEqual(getDomainForValue(25.4), 'units');
    assert.strictEqual(getDomainForValue(440), 'acoustics');
    assert.strictEqual(getDomainForValue(299792458), 'physics');
    assert.strictEqual(getDomainForValue(86400), 'time');
    assert.strictEqual(getDomainForValue(3.14159), 'math');
    assert.strictEqual(getDomainForValue(0.12345), null);
  });

  it('infers domain for names', function () {
    assert.strictEqual(getDomainForName('meanLongitude'), 'astronomy');
    assert.strictEqual(getDomainForName('audioFrequency'), 'acoustics');
    assert.strictEqual(getDomainForName('standardGravity'), 'physics');
    assert.strictEqual(getDomainForName('unixEpochMs'), 'time');
    assert.strictEqual(getDomainForName('avogadroConstant'), 'chemistry');
    assert.strictEqual(getDomainForName('hashMap'), 'cs');
    assert.strictEqual(getDomainForName('ipAddress'), 'networking');
    assert.strictEqual(getDomainForName('rgbaColor'), 'graphics');
    assert.strictEqual(getDomainForName('geodesicLatitude'), 'geodesy');
    assert.strictEqual(getDomainForName('genomeSequence'), 'biology');
    assert.strictEqual(getDomainForName('fooBar'), null);
  });
});