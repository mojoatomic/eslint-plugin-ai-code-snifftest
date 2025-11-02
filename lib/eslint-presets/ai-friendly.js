"use strict";

module.exports = {
  rules: {
    'no-empty-catch': 'warn',
    'no-async-promise-executor': 'error',
    'no-duplicate-case': 'error',
    'no-unreachable': 'warn',
    'no-constant-condition': 'warn',
    'max-depth': ['warn', 4],
    'complexity': ['warn', 15],
    'max-lines-per-function': ['warn', 100]
  }
};