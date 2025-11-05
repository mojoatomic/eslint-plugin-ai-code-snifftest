"use strict";

// Provenance: Computer science terminology
module.exports = Object.freeze({
  constants: [
    1024,      // bytes per KB (binary)
    8,         // bits per byte
    32,        // bits in a 32-bit word
    64,        // bits in a 64-bit word
    256        // common hash/color space size
  ],
  constantMeta: [
    { value: 1024, name: 'BYTES_PER_KB', description: 'Bytes per kilobyte (binary, 2^10)' },
    { value: 8, name: 'BITS_PER_BYTE', description: 'Bits per byte' },
    { value: 32, name: 'BITS_32', description: 'Bits in a 32-bit word' },
    { value: 64, name: 'BITS_64', description: 'Bits in a 64-bit word' },
    { value: 256, name: 'BYTE_MAX_VALUE', description: 'Maximum value for an 8-bit unsigned integer' }
  ],
  terms: [
    'algorithm','binary','byte','bit','stack','queue','tree','graph','hash','cache','memory','pointer','thread','lock','mutex','async'
  ]
});
