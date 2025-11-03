"use strict";

// Sources: widely used standard constants (SI)
module.exports = Object.freeze({
  constants: [
    299792458,    // speed of light in vacuum (m/s)
    9.80665,      // standard gravity (m/s^2)
    6.67430e-11,  // gravitational constant (m^3 kg^-1 s^-2)
  ],
  constantMeta: [
    { value: 299792458, name: 'SPEED_OF_LIGHT_M_PER_S', description: 'c in vacuum (m/s)' },
    { value: 9.80665, name: 'STANDARD_GRAVITY_M_PER_S2', description: 'Standard gravity g (m/s^2)' },
    { value: 6.67430e-11, name: 'GRAVITATIONAL_CONSTANT_SI', description: 'Newtonian gravitational constant G' }
  ],
  terms: [
    'gravity','gravitational','light','vacuum','relativity','planck','newton','force','mass','acceleration','velocity'
  ]
});
