/**
 * @fileoverview Detect redundant calculations that should be computed at compile time
 * @author mojoatomic
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/no-redundant-calculations"),
  RuleTester = require("eslint").RuleTester;


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2021, sourceType: 'module' }
});

ruleTester.run("no-redundant-calculations", rule, {
  valid: [
    // Variables and identifiers
    { code: 'const x = a + b;' },
    { code: 'const x = value * 2;' },
    { code: 'const x = userInput + 5;' },

    // Function calls
    { code: 'const x = calculate() + 5;' },
    { code: 'const x = Math.random() * 10;' },
    { code: 'const x = getValue(a) + getValue(b);' },

    // Array/object access
    { code: 'const x = arr[0] + arr[1];' },
    { code: 'const x = obj.a + obj.b;' },

    // Complex expressions with variables
    { code: 'const x = (a + 2) * (b - 3);' },
    { code: 'const x = a ** 2 + b ** 2;' },

    // Already computed values
    { code: 'const x = 42;' },
    { code: 'const x = 3.14159;' }
  ],

  invalid: [
    // Simple addition
    {
      code: 'const x = 1 + 2;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const x = 3;'
    },
    {
      code: 'const total = 5 + 10;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const total = 15;'
    },

    // Simple subtraction
    {
      code: 'const x = 10 - 3;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const x = 7;'
    },
    {
      code: 'const diff = 100 - 25;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const diff = 75;'
    },

    // Simple multiplication
    {
      code: 'const x = 5 * 3;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const x = 15;'
    },
    {
      code: 'const product = 12 * 4;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const product = 48;'
    },

    // Simple division
    {
      code: 'const x = 10 / 2;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const x = 5;'
    },
    {
      code: 'const half = 100 / 2;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const half = 50;'
    },

    // Modulo
    {
      code: 'const x = 10 % 3;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const x = 1;'
    },

    // Exponentiation
    {
      code: 'const x = 2 ** 3;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const x = 8;'
    },
    {
      code: 'const squared = 5 ** 2;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const squared = 25;'
    },

    // Complex calculations (multiple operations)
    {
      code: 'const x = 1 + 2 + 3;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const x = 6;'
    },
    {
      code: 'const total = 1 + 2 + 3 + 4 + 5;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const total = 15;'
    },
    {
      code: 'const result = 5 * 4 * 3;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const result = 60;'
    },
    {
      code: 'const x = (2 + 3) * 4;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const x = 20;'
    },
    {
      code: 'const x = 10 / 2 + 5;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const x = 10;'
    },

    // Floating point
    {
      code: 'const x = 3.14 * 2;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const x = 6.28;'
    },
    {
      code: 'const x = 1.5 + 2.5;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const x = 4;'
    },

    // In various contexts
    {
      code: 'function test() { return 1 + 2; }',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'function test() { return 3; }'
    },
    {
      code: 'const fn = () => 5 + 10;',
      errors: [{ messageId: 'redundantCalculation' }],
      output: 'const fn = () => 15;'
    },
    {
      code: 'const arr = [1 + 2, 3 + 4];',
      errors: [
        { messageId: 'redundantCalculation' },
        { messageId: 'redundantCalculation' }
      ],
      output: 'const arr = [3, 7];'
    },
    {
      code: 'const obj = { a: 1 + 1, b: 2 * 2 };',
      errors: [
        { messageId: 'redundantCalculation' },
        { messageId: 'redundantCalculation' }
      ],
      output: 'const obj = { a: 2, b: 4 };'
    },

    // Function arguments
    {
      code: 'doSomething(1 + 2, 3 * 4);',
      errors: [
        { messageId: 'redundantCalculation' },
        { messageId: 'redundantCalculation' }
      ],
      output: 'doSomething(3, 12);'
    }
  ],
});
