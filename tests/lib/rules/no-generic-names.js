/**
 * @fileoverview Tests for no-generic-names
 */
'use strict';

const rule = require('../../../lib/rules/no-generic-names'),
  RuleTester = require('eslint').RuleTester;

const ruleTester = new RuleTester({ languageOptions: { ecmaVersion: 2021, sourceType: 'module' } });

ruleTester.run('no-generic-names', rule, {
  valid: [
    { code: 'const track = getTrack();', options: [{ forbiddenNames: ['data','result'] }] },
    { code: 'function userProfile(){}', options: [{ forbiddenNames: ['temp','item'] }] },
    { code: 'const frequencyHz = 440;', options: [{ forbiddenTerms: ['song','audio','file'] }] },
    // New: identifier contains recognized domain term; should not be flagged as generic
    { code: 'const orbitalResult = 1;', options: [{ forbiddenNames: ['result'] }] },
    { code: 'const audioData = 2;', options: [{ forbiddenNames: ['data'] }] },
  ],
  invalid: [
    {
      code: 'const data = fetch();',
      options: [{ forbiddenNames: ['data','result'] }],
      errors: [{ messageId: 'genericName', data: { name: 'data' } }]
    },
    {
      code: 'function result(){}',
      options: [{ forbiddenNames: ['result'] }],
      errors: [{ messageId: 'genericName', data: { name: 'result' } }]
    },
    {
      code: 'const songFilePath = "/a/b";',
      options: [{ forbiddenTerms: ['song'] }],
      errors: [{ messageId: 'forbiddenTerm', data: { term: 'song' } }]
    }
  ]
});

// Deterministic suites via injected settings (config-independent)
(function runDualSuites(){
  const inject = (overrides) => (tc) => ({ ...tc, settings: { 'ai-code-snifftest': overrides } });

  // Rich config: forbiddenNames/terms present → expect flags
  ruleTester.run('no-generic-names [rich]', rule, {
    valid: [
      inject({ antiPatterns: { forbiddenNames: ['data','result'] } })({ code: 'const track = getTrack();' }),
    ],
    invalid: [
      inject({ antiPatterns: { forbiddenNames: ['data','result'] } })({ code: 'const data = fetch();', errors: [{ messageId: 'genericName' }] }),
      inject({ antiPatterns: { forbiddenTerms: ['song'] } })({ code: 'const songFilePath = "/a/b";', errors: [{ messageId: 'forbiddenTerm' }] }),
    ]
  });

  // Minimal config: empty forbidden lists → should not flag
  ruleTester.run('no-generic-names [minimal]', rule, {
    valid: [
      inject({ antiPatterns: { forbiddenNames: [], forbiddenTerms: [] } })({ code: 'const data = fetch();' }),
    ],
    invalid: [ ]
  });
})();
