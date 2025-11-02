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
  constantMeta: [
    { value: 25.4, name: 'MM_PER_INCH', description: 'Millimeters per inch' },
    { value: 2.54, name: 'CM_PER_INCH', description: 'Centimeters per inch' },
    { value: 0.3048, name: 'M_PER_FOOT', description: 'Meters per foot' },
    { value: 1.60934, name: 'KM_PER_MILE', description: 'Kilometers per mile (approx)' }
  ],
  terms: [
    'meter','metre','inch','foot','feet','mile','centimeter','centimetre','millimeter','millimetre','kilometer','kilometre',
    'km','cm','mm','mph','kph','yard'
  ]
});