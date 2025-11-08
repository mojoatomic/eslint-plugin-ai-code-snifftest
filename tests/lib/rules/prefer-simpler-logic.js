/**
 * @fileoverview Simplify boolean expressions and remove redundant logic
 * @author mojoatomic
 */
'use strict';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require('../../../lib/rules/prefer-simpler-logic'),
  RuleTester = require('eslint').RuleTester;


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2021, sourceType: 'module' }
});

//------------------------------------------------------------------------------
// Basic Functionality Tests
//------------------------------------------------------------------------------

const validBasicTests = [
    // Normal comparisons
    { code: 'if (x === y) {}' },
    { code: 'if (a !== b) {}' },
    { code: 'if (count > 0) {}' },
    
    // Different operands in logical expressions
    { code: 'if (x || y) {}' },
    { code: 'if (a && b) {}' },
    // Note: 'x && y || z' tested in edge cases
    
    // Complex but necessary expressions
    { code: 'if (x && y && z) {}' },
    { code: 'if (a || b || c) {}' },
    // Note: 'x && (y || z)' tested in edge cases
    
    // Boolean variables used correctly
    { code: 'if (isValid) {}' },
    { code: 'if (!isError) {}' },
    
    // Non-boolean literals
    { code: 'if (x === 0) {}' },
    { code: 'if (y === "test") {}' },
    { code: 'if (z === null) {}' },
];

//------------------------------------------------------------------------------
// Phase 1: Critical Edge Cases
//------------------------------------------------------------------------------

// Multiple Negation - Test negation chaining
const validMultipleNegation = [
  // Double negation for type coercion (common pattern)
  { code: 'if (!!x) {}' }, // Coerces to boolean
  { code: 'const bool = !!value;' }, // Common idiom
  
  // Single negation (normal)
  { code: 'if (!flag) {}' },
  { code: 'if (!x) {}' },
  
  // Triple negation (not currently detected by rule)
  { code: 'if (!!!x) {}' }, // Rule doesn't handle UnaryExpression chains yet
];

// Mixed Boolean and Non-Boolean - Rule simplifies boolean comparisons independently
const invalidMixedTypes = [
  // Mixed with non-boolean comparisons (boolean part still simplifies)
  {
    code: 'if (x === true || y > 5) {}',
    errors: [{ messageId: 'unnecessaryComparison' }],
    output: 'if (x || y > 5) {}'
  },
  {
    code: 'if (x === true && count > 0) {}',
    errors: [{ messageId: 'unnecessaryComparison' }],
    output: 'if (x && count > 0) {}'
  },
  {
    code: 'if (flag === false || str === "test") {}',
    errors: [{ messageId: 'unnecessaryComparison' }],
    output: 'if (!flag || str === "test") {}'
  },
];

// Type Coercion Differences - Different semantics, should stay valid
const validTypeDifferences = [
  // These have different semantics from x === true
  { code: 'if (x) {}' }, // Truthy check (0, "", null, undefined, false, NaN are falsy)
  // Note: !!x tested in validMultipleNegation
  // Note: x === true IS detected by the rule and simplified to x
];

// Type Coercion - Boolean() function usage
const validTypeCoercion = [
  // Boolean() function (similar to !!)
  { code: 'if (Boolean(x)) {}' },
  { code: 'const bool = Boolean(value);' },
  { code: 'function test() { return Boolean(flag); }' },
];

// Operator Precedence - && has higher precedence than ||
const validOperatorPrecedence = [
  // Precedence is clear (no redundancy)
  { code: 'if (x && y || z) {}' }, // (x && y) || z
  { code: 'if (a || b && c) {}' }, // a || (b && c)
  { code: 'if (x && (y || z)) {}' }, // Explicit grouping
];

// Short-Circuit Evaluation - Must preserve evaluation order
const validShortCircuit = [
  // Side effects matter
  { code: 'if (x || doSomething()) {}' },
  { code: 'if (getValue() && check()) {}' },
  { code: 'if (obj && obj.method()) {}' }, // Null check pattern
  { code: 'if (arr && arr.length > 0) {}' }, // Common pattern
];

// Parentheses and Grouping - Grouping without boolean literals
const validGrouping = [
  // Explicit grouping for readability (no boolean literals to simplify)
  // Note: 'x && (y || z)' tested in validOperatorPrecedence
  { code: 'if ((a || b) && c) {}' },
  { code: 'if ((x)) {}' }, // Extra parens around variable
  // Note: (x === true) still gets simplified even with parens
];

const invalidBasicTests = [
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
];

// Multi-instance: multiple boolean comparisons simplified in one block
const invalidMultiInstance = [
  {
    code: `
if (x === true) {}
if (isReady === true) {}
if (flag === false) {}
`,
    errors: [
      { messageId: 'unnecessaryComparison' },
      { messageId: 'unnecessaryComparison' },
      { messageId: 'unnecessaryComparison' }
    ],
    output: `
if (x) {}
if (isReady) {}
if (!flag) {}
`
  }
];

//------------------------------------------------------------------------------
// Run All Tests
//------------------------------------------------------------------------------

ruleTester.run('prefer-simpler-logic', rule, {
  valid: [
    ...validBasicTests,
    ...validMultipleNegation,
    ...validTypeDifferences,
    ...validTypeCoercion,
    ...validOperatorPrecedence,
    ...validShortCircuit,
    ...validGrouping
  ],
  invalid: [
    ...invalidBasicTests,
    ...invalidMixedTypes,
    ...invalidMultiInstance
  ]
});
