"use strict";

// Provenance: Common financial conventions (e.g., 252 trading days/year), industry practice
module.exports = Object.freeze({
  constants: [
    252,      // trading days per year (US markets, approx)
    12,       // months per year (for compounding)
    365,      // days per year (calendar)
  ],
  terms: [
    'apr','apy','basis','bps','coupon','yield','discount','cashflow','present','future','interest','compounding','risk','volatility','trading'
  ]
});