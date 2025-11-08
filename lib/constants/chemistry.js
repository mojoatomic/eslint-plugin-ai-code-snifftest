'use strict';

// Provenance: Standard chemistry constants
module.exports = Object.freeze({
  constants: [
    6.022e23,  // Avogadro's number (mol^-1)
    8.314,     // Gas constant R (J mol^-1 K^-1)
  ],
  constantMeta: [
    { value: 6.022e23, name: 'AVOGADRO_NUMBER', description: 'Avogadro\'s number (1/mol)' },
    { value: 8.314, name: 'GAS_CONSTANT_R', description: 'Ideal gas constant R (J·mol^-1·K^-1)' }
  ],
  terms: [
    'mole','molar','avogadro','enthalpy','entropy','enthalpy','reaction','bond','stoichiometry','valence','oxidation','reduction'
  ]
});
