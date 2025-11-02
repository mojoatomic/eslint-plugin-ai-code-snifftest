"use strict";

module.exports = {
  rules: {
    // Code Quality
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-const-assign': 'error',
    'no-var': 'error',
    'prefer-const': 'warn',

    // AI-Specific (catch common AI mistakes)
    'no-empty-catch': 'warn',
    'no-unreachable': 'warn',
    'no-duplicate-case': 'error',
    'no-async-promise-executor': 'error',
    'no-constant-condition': 'warn',
    'max-depth': ['warn', 4],
    'complexity': ['warn', 15],
    'max-lines-per-function': ['warn', 100],

    // Consistency
    'quotes': ['warn', 'single', { avoidEscape: true }],
    'semi': ['warn', 'always'],
    'comma-dangle': ['warn', 'always-multiline'],
    'eqeqeq': ['error', 'always'],

    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error'
  }
};