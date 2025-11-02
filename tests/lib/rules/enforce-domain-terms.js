/**
 * @fileoverview Tests for enforce-domain-terms
 */
"use strict";

const rule = require("../../../lib/rules/enforce-domain-terms"),
  RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester({ languageOptions: { ecmaVersion: 2021, sourceType: 'module' } });

const baseOptions = [{ requiredTerms: ['orbit','velocity','payment','order'], exemptNames: ['i','j','k','result'], maxSuggestions: 1 }];

ruleTester.run("enforce-domain-terms", rule, {
  valid: [
    { code: 'const orbitPeriod = 27.3;', options: baseOptions },
    { code: 'function calculateVelocity(){}', options: baseOptions },
    { code: 'class PaymentService{}', options: baseOptions },
    { code: 'let orderItems = [];', options: baseOptions },
    { code: 'const result = compute();', options: baseOptions }, // exempt
    { code: 'const i = 0; const j = 1; const k = 2;', options: baseOptions }, // short names skipped
    { code: 'const orbitalAngle = 10;', options: [{ requiredTerms: ['orbit','velocity','orbital'] }] },
  ],
  invalid: [
    {
      code: 'const data = 1;',
      options: baseOptions,
errors: [{ messageId: 'missingDomain', data: { name: 'data' }, suggestions: [{ messageId: 'suggestRename', output: 'const orbit = 1;' }] }]
    },
    {
      code: 'function value(){}',
      options: baseOptions,
errors: [{ messageId: 'missingDomain', data: { name: 'value' }, suggestions: [{ messageId: 'suggestRename', output: 'function orbit(){}' }] }]
    },
    {
      code: 'class Item {}',
      options: baseOptions,
errors: [{ messageId: 'missingDomain', data: { name: 'Item' }, suggestions: [{ messageId: 'suggestRename', output: 'class orbitItem {}' }] }]
    },
    {
      code: 'let tmp = 0;',
      options: baseOptions,
errors: [{ messageId: 'missingDomain', data: { name: 'tmp' }, suggestions: [{ messageId: 'suggestRename', output: 'let orbit = 0;' }] }]
    },
    {
      code: 'const count = 3;',
      options: baseOptions,
errors: [{ messageId: 'missingDomain', data: { name: 'count' }, suggestions: [{ messageId: 'suggestRename', output: 'const orbit = 3;' }] }]
    },
    {
      code: 'let arr = [];',
      options: baseOptions,
errors: [{ messageId: 'missingDomain', data: { name: 'arr' }, suggestions: [{ messageId: 'suggestRename', output: 'let orbit = [];' }] }]
    },
    {
      code: 'const obj = {};',
      options: baseOptions,
errors: [{ messageId: 'missingDomain', data: { name: 'obj' }, suggestions: [{ messageId: 'suggestRename', output: 'const orbit = {};' }] }]
    },
    {
      code: 'let str = "";',
      options: baseOptions,
errors: [{ messageId: 'missingDomain', data: { name: 'str' }, suggestions: [{ messageId: 'suggestRename', output: 'let orbit = "";' }] }]
    },
    {
      code: 'let flag = true;',
      options: baseOptions,
errors: [{ messageId: 'missingDomain', data: { name: 'flag' }, suggestions: [{ messageId: 'suggestRename', output: 'let orbit = true;' }] }]
    },
    {
      code: 'let name = "x";',
      options: baseOptions,
errors: [{ messageId: 'missingDomain', data: { name: 'name' }, suggestions: [{ messageId: 'suggestRename', output: 'let orbit = "x";' }] }]
    },
  ]
});