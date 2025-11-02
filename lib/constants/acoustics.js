"use strict";

module.exports = Object.freeze({
  constants: [
    440,    // A4 reference frequency (Hz)
    44100   // common audio sample rate (Hz)
  ],
  constantMeta: [
    { value: 440, name: 'A4_FREQUENCY_HZ', description: 'Concert pitch A4 frequency in Hz' },
    { value: 44100, name: 'SAMPLE_RATE_CD_HZ', description: 'CD-quality audio sample rate in Hz' }
  ],
  terms: [
    'frequency','pitch','tuning','concert','a4','audio','music','hertz','hz'
  ]
});
