/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');

const { estimateEffort } = require(path.join(__dirname, '..', '..', '..', 'lib', 'commands', 'analyze', 'estimator'));

function makeFile(tmpDir, name, lines = 1200) {
  const p = path.join(tmpDir, name);
  fs.writeFileSync(p, Array.from({ length: lines }, (_, i) => `// ${i}`).join('\n') + '\n');
  return p;
}

describe('estimator weighting', () => {
  it('applies per-rule weights and file-size factor when enabled', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'est-wt-'));
    const big = makeFile(tmpDir, 'big.js', 1500); // 1.5k lines → factor 2x (cap)
    const small = makeFile(tmpDir, 'small.js', 100); // ~1.1x factor

    const categories = {
      complexity: [
        { ruleId: 'complexity', filePath: big },
        { ruleId: 'ai-code-snifftest/no-redundant-conditionals', filePath: small }
      ],
      architecture: [ { ruleId: 'max-lines-per-function', filePath: small } ],
      domainTerms: [ { ruleId: 'ai-code-snifftest/no-generic-names', filePath: small } ],
      magicNumbers: [ { ruleId: 'ai-code-snifftest/no-redundant-calculations', filePath: small } ]
    };

    const e1 = estimateEffort(categories, { cwd: tmpDir, useFileSize: false });
    const e2 = estimateEffort(categories, { cwd: tmpDir, useFileSize: true });

    // e2 should be >= e1 due to file-size multipliers
    assert.ok(e2.hours >= e1.hours);

    // Basic weighting sanity (complexity dominates)
    assert.ok(e1.byCategory.complexity > e1.byCategory.architecture);
  });
});
