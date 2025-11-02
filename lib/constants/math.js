"use strict";

module.exports = Object.freeze({
  constants: [
    3.14159,   // pi (approx)
    2.71828,   // e (approx)
    1.61803,   // golden ratio (phi) approx
  ],
  constantMeta: [
    { value: 3.14159, name: 'PI', description: 'π (approx)' },
    { value: 2.71828, name: 'E', description: 'Euler’s number (approx)' },
    { value: 1.61803, name: 'GOLDEN_RATIO', description: 'Golden ratio φ (approx)' }
  ],
  terms: [
    'pi','tau','phi','euler','log','trig','sine','cosine','tangent','rad','deg'
  ]
});