/**
 * @fileoverview Tests for no-generic-names
 */
"use strict";

const rule = require("../../../lib/rules/no-generic-names"),
  RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester({ languageOptions: { ecmaVersion: 2021, sourceType: 'module' } });

ruleTester.run("no-generic-names", rule, {
  valid: [
    { code: 'const track = getTrack();', options: [{ forbiddenNames: ['data','result'] }] },
    { code: 'function userProfile(){}', options: [{ forbiddenNames: ['temp','item'] }] },
    { code: 'const frequencyHz = 440;', options: [{ forbiddenTerms: ['song','audio','file'] }] },
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