'use strict';

// Provenance: Common financial conventions (e.g., 252 trading days/year), industry practice
module.exports = Object.freeze({
  constants: [
    252,      // trading days per year (US markets, approx)
    12,       // months per year (for compounding)
    365,      // days per year (calendar)
  ],
  constantMeta: [
    { value: 252, name: 'TRADING_DAYS_PER_YEAR', description: 'Trading days per year (approx)' },
    { value: 12, name: 'MONTHS_PER_YEAR', description: 'Months per year' },
    { value: 365, name: 'DAYS_PER_YEAR', description: 'Days per year (calendar)' }
  ],
  terms: [
    'apr','apy','basis','bps','coupon','yield','discount','cashflow','present','future','interest','compounding','risk','volatility','trading'
  ]
});
