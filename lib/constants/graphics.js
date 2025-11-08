'use strict';

// Provenance: Computer graphics terminology
module.exports = Object.freeze({
  constants: [
    255,       // Max RGB value (8-bit)
    1.0,       // Max alpha value (normalized)
    60,        // Common target FPS
    2.2,       // Standard gamma
    16.666667  // Frame time in ms at 60fps
  ],
  constantMeta: [
    { value: 255, name: 'RGB_MAX', description: 'Maximum RGB channel value (8-bit)' },
    { value: 1.0, name: 'ALPHA_OPAQUE', description: 'Fully opaque alpha value' },
    { value: 60, name: 'TARGET_FPS', description: 'Common target frames per second' },
    { value: 2.2, name: 'SRGB_GAMMA', description: 'sRGB standard gamma value' },
    { value: 16.666667, name: 'FRAME_TIME_MS_60FPS', description: 'Frame time in milliseconds at 60fps' }
  ],
  terms: [
    'rgba','alpha','gamma','render','shader','texture','vertex','fragment','antialias','depth','stencil','occlusion'
  ]
});
