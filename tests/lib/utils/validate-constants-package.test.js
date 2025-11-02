/* eslint-env mocha */
/* global describe, it */
"use strict";

const assert = require('assert');
const { validateConstantsPackage } = require('../../../lib/utils/validate-constants-package');

describe('validate-constants-package', function () {
  it('accepts a valid package', function () {
    const pkg = {
      domain: 'medical',
      version: '1.0.0',
      constants: [
        { value: 37.0, name: 'NORMAL_BODY_TEMP_C', description: 'Normal body temperature (C)' },
        { value: '98.6', name: 'NORMAL_BODY_TEMP_F', description: 'Normal body temperature (F)' }
      ],
      terms: { entities: ['Patient'] }
    };
    assert.doesNotThrow(() => validateConstantsPackage(pkg));
  });

  it('rejects invalid package', function () {
    const bad = { domain: 'Bad Domain', version: 'not-a-semver', constants: [] };
    assert.throws(() => validateConstantsPackage(bad));
  });
});