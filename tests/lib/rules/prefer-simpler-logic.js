/**
 * @fileoverview Simplify boolean expressions and remove redundant logic
 * @author mojoatomic
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/prefer-simpler-logic"),
  RuleTester = require("eslint").RuleTester;


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2021, sourceType: 'module' }
});

ruleTester.run("prefer-simpler-logic", rule, {
  valid: [
    // Normal comparisons
    { code: 'if (x === y) {}' },
    { code: 'if (a !== b) {}' },
    { code: 'if (count > 0) {}' },
    
    // Different operands in logical expressions
    { code: 'if (x || y) {}' },
    { code: 'if (a && b) {}' },
    { code: 'if (x && y || z) {}' },
    
    // Complex but necessary expressions
    { code: 'if (x && y && z) {}' },
    { code: 'if (a || b || c) {}' },
    
    // Boolean variables used correctly
    { code: 'if (isValid) {}' },
    { code: 'if (!isError) {}' },
    
    // Non-boolean literals
    { code: 'if (x === 0) {}' },
    { code: 'if (y === "test") {}' },
    { code: 'if (z === null) {}' },
  ],

  invalid: [
    // x === true → x
    {
      code: 'if (x === true) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (x) {}'
    },
    {
      code: 'if (isValid === true) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (isValid) {}'
    },
    {
      code: 'const result = value === true;',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'const result = value;'
    },
    
    // true === x → x
    {
      code: 'if (true === x) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (x) {}'
    },
    {
      code: 'if (true === isReady) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (isReady) {}'
    },
    
    // x === false → !x
    {
      code: 'if (x === false) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (!x) {}'
    },
    {
      code: 'if (isError === false) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (!isError) {}'
    },
    {
      code: 'const result = flag === false;',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'const result = !flag;'
    },
    
    // false === x → !x
    {
      code: 'if (false === x) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (!x) {}'
    },
    {
      code: 'if (false === isActive) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (!isActive) {}'
    },
    
    // x !== true → !x
    {
      code: 'if (x !== true) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (!x) {}'
    },
    {
      code: 'if (isValid !== true) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (!isValid) {}'
    },
    
    // true !== x → !x
    {
      code: 'if (true !== x) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (!x) {}'
    },
    
    // x !== false → x
    {
      code: 'if (x !== false) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (x) {}'
    },
    {
      code: 'if (isError !== false) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (isError) {}'
    },
    
    // false !== x → x
    {
      code: 'if (false !== x) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (x) {}'
    },
    
    // x == true → x (loose equality)
    {
      code: 'if (x == true) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (x) {}'
    },
    {
      code: 'if (x == false) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (!x) {}'
    },
    
    // x != true → !x (loose equality)
    {
      code: 'if (x != true) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (!x) {}'
    },
    {
      code: 'if (x != false) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'if (x) {}'
    },
    
    // x || x → x
    {
      code: 'if (x || x) {}',
      errors: [{ messageId: 'redundantExpression' }],
      output: 'if (x) {}'
    },
    {
      code: 'if (isValid || isValid) {}',
      errors: [{ messageId: 'redundantExpression' }],
      output: 'if (isValid) {}'
    },
    {
      code: 'const result = value || value;',
      errors: [{ messageId: 'redundantExpression' }],
      output: 'const result = value;'
    },
    
    // x && x → x
    {
      code: 'if (x && x) {}',
      errors: [{ messageId: 'redundantExpression' }],
      output: 'if (x) {}'
    },
    {
      code: 'if (isError && isError) {}',
      errors: [{ messageId: 'redundantExpression' }],
      output: 'if (isError) {}'
    },
    {
      code: 'const result = flag && flag;',
      errors: [{ messageId: 'redundantExpression' }],
      output: 'const result = flag;'
    },
    
    // x && y || y → x || y (absorbing element)
    {
      code: 'if (x && y || y) {}',
      errors: [{ messageId: 'redundantExpression' }],
      output: 'if (x || y) {}'
    },
    {
      code: 'if (a && b || b) {}',
      errors: [{ messageId: 'redundantExpression' }],
      output: 'if (a || b) {}'
    },
    {
      code: 'const result = isValid && isReady || isReady;',
      errors: [{ messageId: 'redundantExpression' }],
      output: 'const result = isValid || isReady;'
    },
    
    // y && x || y → y || x (reverse order)
    {
      code: 'if (y && x || y) {}',
      errors: [{ messageId: 'redundantExpression' }],
      output: 'if (y || x) {}'
    },
    
    // Complex expressions
    {
      code: 'function test() { return condition === true; }',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'function test() { return condition; }'
    },
    {
      code: 'const fn = () => value === false;',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'const fn = () => !value;'
    },
    {
      code: 'while (running === true) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'while (running) {}'
    },
    {
      code: 'for (let i = 0; flag === true; i++) {}',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'for (let i = 0; flag; i++) {}'
    },
    
    // In ternary
    {
      code: 'const result = x === true ? a : b;',
      errors: [{ messageId: 'unnecessaryComparison' }],
      output: 'const result = x ? a : b;'
    },
    
    // Multiple issues in same statement
    {
      code: 'if (x === true || y === true) {}',
      errors: [
        { messageId: 'unnecessaryComparison' },
        { messageId: 'unnecessaryComparison' }
      ],
      output: 'if (x || y) {}'
    },
    {
      code: 'if (a === false && b === false) {}',
      errors: [
        { messageId: 'unnecessaryComparison' },
        { messageId: 'unnecessaryComparison' }
      ],
      output: 'if (!a && !b) {}'
    },
  ],
});
