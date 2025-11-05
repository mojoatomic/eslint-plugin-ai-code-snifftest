/* eslint-env mocha */
/* global describe, it */
"use strict";

const assert = require('assert');

const { summarizeFileContent } = require('../../../lib/scanner/extract');
const { reconcile, DEFAULT_SANITY } = require('../../../lib/scanner/reconcile');

describe('scanner/reconcile', function() {
  it('summarizeFileContent extracts naming and constants', function() {
    const src = `
      const isReady = true; const hasValue = false;
      const fooBar = 1; const SNAKE_NAME = 2; const snake_case = 3;
      function doThing() { return 365.25 + 60; }
      const data = 0; const result = 1;
    `;
    const sum = summarizeFileContent(src);
    assert.ok(sum.naming && sum.naming.casing);
    assert.ok(sum.constants.find(c => c.value === 365.25));
    assert.ok(sum.naming.booleanPrefixes.withPrefix >= 2);
  });

  it('reconcile computes score and domain-aware constants', function() {
    const findings = {
      constants: [{ value: 365.25, confidence: 0.9 }, { value: 60, confidence: 0.9 }],
      naming: { casing: { camelCase: 10, snake_case: 0, UPPER_SNAKE_CASE: 2, PascalCase: 0 }, booleanPrefixes: { withPrefix: 5, without: 1, distribution: { is:3, has:2 } } },
      genericNames: { data: 5, result: 3 }
    };
    const rec = reconcile(findings, DEFAULT_SANITY, { config: { domainPriority: ['time','astronomy'], constantResolution: {} } });
    assert.ok(rec.score && typeof rec.score.overall === 'number');
    assert.ok(rec.domain.constants.length >= 1);
    assert.ok(rec.result.naming.style);
  });
});
