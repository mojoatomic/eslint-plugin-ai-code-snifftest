/**
 * @fileoverview Tests for enforce-naming-conventions
 */
'use strict';

const rule = require('../../../lib/rules/enforce-naming-conventions'),
  RuleTester = require('eslint').RuleTester;

const ruleTester = new RuleTester({ languageOptions: { ecmaVersion: 2021, sourceType: 'module' } });

const baseOptions = [{ style: 'camelCase', booleanPrefix: ['is','has'], asyncPrefix: ['fetch','load'], pluralizeCollections: true, maxSuggestions: 1 }];

ruleTester.run('enforce-naming-conventions', rule, {
  valid: [
    // Style - already camelCase
    { code: 'const userProfile = 1;', options: baseOptions },
    { code: 'function getUser(){}', options: baseOptions },

    // Boolean prefix respected
    { code: 'const isActive = true;', options: baseOptions },

    // Async prefix respected
    { code: 'async function fetchUser(){}', options: baseOptions },

    // Pluralized collections
    { code: 'const users = [];', options: baseOptions },
    { code: 'const userList = [];', options: baseOptions },
    { code: 'const idSet = new Set();', options: baseOptions },
    { code: 'const dataMap = new Map();', options: baseOptions },
  ],
  invalid: [
    // Style: snake_case -> camelCase
    {
      code: 'const user_profile = 1;',
      options: baseOptions,
      errors: [{ messageId: 'wrongStyle', data: { name: 'user_profile', style: 'camelCase' }, suggestions: [{ messageId: 'suggestRename', output: 'const userProfile = 1;' }] }]
    },

    // Boolean prefix missing
    {
      code: 'const active = true;',
      options: baseOptions,
      errors: [{ messageId: 'booleanPrefix', data: { name: 'active', prefixes: 'is, has' }, suggestions: [{ messageId: 'suggestRename', output: 'const isActive = true;' }] }]
    },

    // Async prefix missing
    {
      code: 'async function user(){}',
      options: baseOptions,
      errors: [{ messageId: 'asyncPrefix', data: { name: 'user', prefixes: 'fetch, load' }, suggestions: [{ messageId: 'suggestRename', output: 'async function fetchUser(){}' }] }]
    },

    // Collection not pluralized
    {
      code: 'const user = [];',
      options: baseOptions,
      errors: [{ messageId: 'pluralCollection', data: { name: 'user' }, suggestions: [{ messageId: 'suggestRename', output: 'const users = [];' }] }]
    },
    {
      code: 'const item = new Set();',
      options: baseOptions,
      errors: [{ messageId: 'pluralCollection', data: { name: 'item' }, suggestions: [{ messageId: 'suggestRename', output: 'const items = new Set();' }] }]
    },
    {
      code: 'const entry = new Map();',
      options: baseOptions,
      errors: [{ messageId: 'pluralCollection', data: { name: 'entry' }, suggestions: [{ messageId: 'suggestRename', output: 'const entries = new Map();' }] }]
    }
  ]
});

// Deterministic suites via injected settings (config-independent)
(function runDualSuites(){
  const inject = (overrides) => (tc) => ({ ...tc, settings: { 'ai-code-snifftest': { naming: overrides } } });

  // camel+prefix baseline
  ruleTester.run('enforce-naming-conventions [camel+prefix]', rule, {
    valid: [
      inject({ style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true })({ code: 'const isReady = true;' }),
      inject({ style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true })({ code: 'async function fetchUser(){}' }),
      inject({ style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true })({ code: 'const users = [];' }),
    ],
    invalid: [
      inject({ style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true })({ code: 'const user_profile = 1;', errors: [{ messageId: 'wrongStyle', suggestions: [{ messageId: 'suggestRename', output: 'const userProfile = 1;' }] }] }),
      inject({ style: 'camelCase', booleanPrefix: ['is','has','should','can'], asyncPrefix: ['fetch','load','save'], pluralizeCollections: true })({ code: 'const active = true;', errors: [{ messageId: 'booleanPrefix', suggestions: [{ messageId: 'suggestRename', output: 'const isActive = true;' }] }] }),
    ]
  });

  // tweaked config: narrower boolean prefixes and no pluralization
  ruleTester.run('enforce-naming-conventions [tweaked]', rule, {
    valid: [
      inject({ style: 'camelCase', booleanPrefix: ['has'], asyncPrefix: ['fetch'], pluralizeCollections: false })({ code: 'const hasAccess = true;' }),
      // pluralization disabled: previously invalid singular becomes valid
      inject({ style: 'camelCase', booleanPrefix: ['has'], asyncPrefix: ['fetch'], pluralizeCollections: false })({ code: 'const user = [];'}),
    ],
    invalid: [
      // shouldProcess no longer allowed when booleanPrefix=['has'] only
      inject({ style: 'camelCase', booleanPrefix: ['has'], asyncPrefix: ['fetch'], pluralizeCollections: false })({ code: 'const shouldProcess = true;', errors: [{ messageId: 'booleanPrefix', suggestions: [{ messageId: 'suggestRename', output: 'const hasShouldProcess = true;' }] }] }),
    ]
  });

  // minimal asyncPrefix variations
  ruleTester.run('enforce-naming-conventions [asyncPrefix-variations]', rule, {
    valid: [
      inject({ style: 'camelCase', booleanPrefix: ['is'], asyncPrefix: ['load'], pluralizeCollections: true })({ code: 'async function loadUser(){}' }),
    ],
    invalid: [
      inject({ style: 'camelCase', booleanPrefix: ['is'], asyncPrefix: ['load'], pluralizeCollections: true })({ code: 'async function fetchUser(){}', errors: [{ messageId: 'asyncPrefix', suggestions: [{ messageId: 'suggestRename', output: 'async function loadFetchUser(){}' }] }] }),
    ]
  });
})();
