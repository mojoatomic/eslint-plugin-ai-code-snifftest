/* eslint-env mocha */
/* eslint ai-code-snifftest/no-generic-names: off */
/* global describe, it */
'use strict';

const assert = require('assert');
const path = require('path');

const { categorizeViolations } = require(path.join(__dirname, '..', '..', '..', 'lib', 'commands', 'analyze', 'categorizer'));
const { attachDomainContext } = require(path.join(__dirname, '..', '..', '..', 'lib', 'commands', 'analyze', 'domain'));

const cfg = {
  domains: { primary: 'astronomy', additional: [] },
  domainPriority: ['astronomy']
};

describe('domain-aware analysis', () => {
  it('infers domain from known constants/terms using constants catalog', () => {
    const eslintOutput = [{ filePath: 'astro.js', messages: [
      { ruleId: 'ai-code-snifftest/no-redundant-calculations', severity: 1, message: 'Use named constant instead of 365.25' },
      { ruleId: 'ai-code-snifftest/enforce-domain-terms', severity: 1, message: 'Prefer ecliptic over plane' }
    ] }];
    let cats = categorizeViolations(eslintOutput, cfg);
    cats = attachDomainContext(cats, cfg);
    const hasAstronomy = (list) => list.some(r => r.domain === 'astronomy');
    assert.ok(hasAstronomy(cats.magicNumbers));
    assert.ok(hasAstronomy(cats.domainTerms));
    assert.ok(Array.isArray(cats.domainSummary) && cats.domainSummary.length >= 1);
  });
});