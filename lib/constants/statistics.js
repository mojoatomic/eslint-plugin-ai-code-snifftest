"use strict";

// Provenance: Common statistical constants and terms
module.exports = Object.freeze({
  constants: [
    1.96,   // z-score for 95% two-tailed
    2.576,  // z-score for 99% two-tailed
  ],
  constantMeta: [
    { value: 1.96, name: 'Z_95_TWO_TAILED', description: 'Z-score for 95% two-tailed interval' },
    { value: 2.576, name: 'Z_99_TWO_TAILED', description: 'Z-score for 99% two-tailed interval' }
  ],
  terms: [
    'mean','median','variance','stddev','stdev','zscore','quantile','percentile','confidence','interval','distribution','normal','gaussian'
  ]
});
