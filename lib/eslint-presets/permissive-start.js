'use strict';

// Permissive start preset: measure-only rules for progressive ratcheting
module.exports = {
  rules: {
    // Baseline – measure only
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-undef': 'warn',
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'eqeqeq': ['warn', 'always'],
    'camelcase': ['warn', { properties: 'never', ignoreDestructuring: true, ignoreImports: true }],

    // Architecture – measure only
    'complexity': ['warn', 10],
    'max-lines': ['warn', 250],
    'max-lines-per-function': ['warn', 50],
    'max-depth': ['warn', 4],
    'max-params': ['warn', 4],
    'max-statements': ['warn', 30],

    // Plugin – measure only (domain/structure)
    'ai-code-snifftest/no-redundant-calculations': 'warn',
    'ai-code-snifftest/no-equivalent-branches': 'warn',
    'ai-code-snifftest/prefer-simpler-logic': 'warn',
    'ai-code-snifftest/no-redundant-conditionals': 'warn',
    'ai-code-snifftest/no-unnecessary-abstraction': 'warn',
    'ai-code-snifftest/no-generic-names': 'warn',
    'ai-code-snifftest/enforce-domain-terms': 'warn'
  }
};