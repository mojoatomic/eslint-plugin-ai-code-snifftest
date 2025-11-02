"use strict";

module.exports = Object.freeze({
  constants: [
    // Length conversions
    25.4,   // mm per inch
    2.54,   // cm per inch
    0.3048, // m per foot
    0.0254, // m per inch
    0.9144, // m per yard
    1.60934, // km per mile (approx)
    1.609344 // km per mile (exact in many tables)
  ],
  terms: [
    'meter','metre','inch','foot','feet','mile','centimeter','centimetre','millimeter','millimetre','kilometer','kilometre',
    'km','cm','mm','mph','kph','yard'
  ]
});