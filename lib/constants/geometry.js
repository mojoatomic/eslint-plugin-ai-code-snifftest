'use strict';

// Provenance: Euclidean geometry basics
module.exports = Object.freeze({
  constants: [
    180,   // degrees in a triangle's interior angle sum
    360,   // degrees in a circle
    6.283185, // 2π radians (approx)
    1.570796, // π/2 radians (approx)
  ],
  constantMeta: [
    { value: 360, name: 'DEGREES_IN_CIRCLE', description: 'Full rotation in degrees' },
    { value: 180, name: 'DEGREES_IN_SEMICIRCLE', description: 'Half rotation in degrees' },
    { value: 6.283185, name: 'RADIANS_IN_CIRCLE', description: '2π radians (approx)' },
    { value: 1.570796, name: 'RIGHT_ANGLE_RAD', description: 'Right angle in radians (≈π/2)' }
  ],
  terms: [
    'angle','triangle','circle','radius','diameter','perimeter','area','polygon','arc','sector','chord'
  ]
});