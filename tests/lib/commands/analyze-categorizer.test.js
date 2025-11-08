/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const path = require('path');

const { categorizeViolations } = require(path.join(__dirname, '..', '..', '..', 'lib', 'commands', 'analyze', 'categorizer'));

function sampleResult(messagesByRule) {
  return [{ filePath: 'a.js', messages: messagesByRule.map(({ ruleId, severity = 1 }) => ({ ruleId, severity, message: 'x' })) }];
}

describe('categorizeViolations', () => {
  it('groups by category and counts severities/fixable', () => {
    const fixtures = [{ filePath: 'f1.js', messages: [
      { ruleId: 'ai-code-snifftest/no-redundant-calculations', severity: 1 },
      { ruleId: 'complexity', severity: 2 },
      { ruleId: 'ai-code-snifftest/enforce-domain-terms', severity: 1 },
      { ruleId: 'max-lines', severity: 1, fix: { range: [0,1], text: '' } }
    ] }];

    const out = categorizeViolations(fixtures, {});
    assert.strictEqual(out.magicNumbers.length, 1);
    assert.strictEqual(out.complexity.length, 1);
    assert.strictEqual(out.domainTerms.length, 1);
    assert.strictEqual(out.architecture.length, 1);
    assert.strictEqual(out.counts.errors, 1);
    assert.strictEqual(out.counts.warnings, 3);
    assert.strictEqual(out.counts.autoFixable, 1);
  });
});