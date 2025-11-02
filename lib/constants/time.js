"use strict";

module.exports = Object.freeze({
  constants: [
    1000,       // milliseconds per second
    60,         // seconds per minute
    3600,       // seconds per hour
    86400,      // seconds per day
    86400000,   // milliseconds per day
  ],
  constantMeta: [
    { value: 1000, name: 'MS_PER_SECOND', description: 'Milliseconds per second' },
    { value: 60, name: 'SECONDS_PER_MINUTE', description: 'Seconds per minute' },
    { value: 3600, name: 'SECONDS_PER_HOUR', description: 'Seconds per hour' },
    { value: 86400, name: 'SECONDS_PER_DAY', description: 'Seconds per day' },
    { value: 86400000, name: 'MS_PER_DAY', description: 'Milliseconds per day' }
  ],
  terms: [
    'epoch','unix','utc','millisecond','second','minute','hour','day','week','julian'
  ]
});
