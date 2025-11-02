/**
 * @fileoverview Simplify redundant conditional expressions
 * @author mojoatomic
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/no-redundant-conditionals"),
  RuleTester = require("eslint").RuleTester;


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({ languageOptions: { ecmaVersion: 2021, sourceType: 'module' } });

//------------------------------------------------------------------------------
// Basic Functionality Tests
//------------------------------------------------------------------------------

const validBasicTests = [
    // Normal conditions
    'if (x) { doSomething(); }',
    'function test() { if (x > 5) { return true; } }',
    'if (condition && other) { }',
    
    // Variables (not constants)
    'if (value) { doWork(); }',
    'const result = x ? getValue() : getOther();',
    
    // Ternaries with different values
    'const x = condition ? 1 : 2;',
    'const y = test ? "yes" : "no";',
    
    // Number/string comparisons (not boolean)
    'if (x === 1) { }',
    'if (value === "true") { }',
];

//------------------------------------------------------------------------------
// Phase 1: Critical Edge Cases
//------------------------------------------------------------------------------

// Falsy Values - Different falsy values have different semantics
const validFalsyValues = [
  // null check (intentional)
  'if (x === null) { handleNull(); }',
  'if (value !== null) { useValue(); }',
  
  // undefined check (intentional)
  'if (x === undefined) { handleUndefined(); }',
  'if (typeof x !== "undefined") { }',
  
  // NaN check (special case)
  'if (Number.isNaN(x)) { }',
  'if (x !== x) { }', // NaN !== NaN pattern
  
  // Empty string check (intentional)
  'if (str === "") { handleEmpty(); }',
  'if (str !== "") { handleNonEmpty(); }',
];

const invalidFalsyValues = [
  // Null as constant condition
  {
    code: 'if (null) { unreachable(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: '',
  },
  // Undefined as constant condition
  {
    code: 'if (undefined) { unreachable(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: '',
  },
  // NaN as constant condition
  {
    code: 'if (NaN) { unreachable(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: '',
  },
];

// Truthy Values - Non-boolean truthy constants
const invalidTruthyValues = [
  // Non-empty string
  {
    code: 'if ("hello") { alwaysRuns(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'alwaysRuns();',
  },
  // Positive number
  {
    code: 'if (42) { alwaysRuns(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'alwaysRuns();',
  },
  // Negative number
  {
    code: 'if (-1) { alwaysRuns(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'alwaysRuns();',
  },
  // Object literal
  {
    code: 'if ({}) { alwaysRuns(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'alwaysRuns();',
  },
  // Array literal
  {
    code: 'if ([]) { alwaysRuns(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'alwaysRuns();',
  },
];

// Complex Ternaries - Edge cases for ternary simplification
const validComplexTernaries = [
  // Different boolean values (not redundant)
  'const x = condition ? getValue() : false;',
  'const y = test ? true : getDefault();',
  
  // Non-boolean values
  'const result = x ? "yes" : "no";',
  'const num = condition ? 1 : 0;',
  
  // Complex expressions
  'const value = x ? compute(a) : compute(b);', // Different args
  'const result = test ? obj.method() : other.method();', // Different objects
];

const invalidComplexTernaries = [
  // Boolean() wrapper pattern
  {
    code: 'const bool = x ? true : false;',
    errors: [{ messageId: 'redundantTernary' }],
    output: 'const bool = Boolean(x);',
  },
  // Negation pattern
  {
    code: 'const inverted = x ? false : true;',
    errors: [{ messageId: 'redundantTernary' }],
    output: 'const inverted = !x;',
  },
  // Same literal value
  {
    code: 'const same = condition ? 42 : 42;',
    errors: [{ messageId: 'redundantTernary' }],
    output: 'const same = 42;',
  },
  // Same variable
  {
    code: 'function test() { return test ? result : result; }',
    errors: [{ messageId: 'redundantTernary' }],
    output: 'function test() { return result; }',
  },
];

// Coverage Gap Tests - Additional edge cases
const invalidCoverageGaps = [
  // CRITICAL: Non-block statement with constant condition (line 180-181)
  {
    code: 'if (true) doSomething();',
    errors: [{ messageId: 'constantCondition' }],
    output: 'doSomething();'
  },
  {
    code: 'if (false) unreachable();',
    errors: [{ messageId: 'constantCondition' }],
    output: ''
  },
  // NICE-TO-HAVE: Unary plus operator (line 82-83)
  {
    code: 'if (+1) { alwaysRuns(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'alwaysRuns();'
  },
  {
    code: 'if (+0) { unreachable(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: ''
  },
  // NICE-TO-HAVE: Negation operator (line 85-87)
  {
    code: 'if (!0) { alwaysRuns(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'alwaysRuns();'
  },
  {
    code: 'if (!1) { unreachable(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: ''
  }
];

// Nested Conditionals - Multiple levels
const validNestedConditionals = [
  // Nested with different conditions
  'if (x) { if (y) { doWork(); } }',
  'const result = a ? (b ? 1 : 2) : 3;',
];

// Logical Expressions - Complex boolean logic
const validLogicalExpressions = [
  // Short-circuit evaluation (intentional)
  'if (x && y) { }',
  'if (a || b) { }',
  'const value = x || defaultValue;',
  'const safe = obj && obj.property;',
  
  // Nullish coalescing
  'const value = x ?? defaultValue;',
];

// Constant Folding in Conditions
const invalidConstantFolding = [
  // true && x -> x
  {
    code: 'if (true && cond) { work(); }',
    errors: [{ messageId: 'redundantLogical' }],
    output: 'if (cond) { work(); }'
  },
  // false || x -> x
  {
    code: 'if (false || cond) { work(); }',
    errors: [{ messageId: 'redundantLogical' }],
    output: 'if (cond) { work(); }'
  },
  // true || x -> true (constant)
  {
    code: 'if (true || cond) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  },
  // false && x -> false (constant)
  {
    code: 'if (false && cond) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'B();'
  },
  // Arithmetic folding in condition
  {
    code: 'if (1 + 1) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  },
  {
    code: 'if (0 + 0) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'B();'
  },
  // Relational/equality folding
  {
    code: 'if (5 > 3) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  },
  {
    code: 'if (2 * 3 !== 6) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'B();'
  },
  // String concatenation truthiness
  {
    code: "if ('a' + 'b') { A(); } else { B(); }",
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  },
  {
    code: "if ('' + '') { A(); } else { B(); }",
    errors: [{ messageId: 'constantCondition' }],
    output: 'B();'
  },
  // Number operator coverage (-, *, /, %, **)
  {
    code: 'if (5 - 3) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  },
  {
    code: 'if (2 * 3) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  },
  {
    code: 'if (4 / 2) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  },
  {
    code: 'if (5 % 2) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  },
  {
    code: 'if (1 ** 3) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  },
  // Relational operator coverage (<, >, <=, >=)
  {
    code: 'if (3 < 2) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'B();'
  },
  {
    code: 'if (3 > 2) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  },
  {
    code: 'if (2 <= 2) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  },
  {
    code: 'if (2 >= 3) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'B();'
  },
  // Strict equality/inequality coverage
  {
    code: 'if (1 + 1 === 2) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  },
  {
    code: 'if (2 * 2 !== 4) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'B();'
  },
  // Undefined/NaN edge equality
  {
    code: 'if (undefined === undefined) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  },
  {
    code: 'if (NaN === NaN) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'B();'
  },
  {
    code: 'if (NaN !== NaN) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  },
  // Logical with literal truthy/falsy
  {
    code: 'if ({} || cond) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  },
  {
    code: 'if (false && []) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'B();'
  },
  // More arithmetic falsy
  {
    code: 'if (1 - 1) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'B();'
  },
  {
    code: 'if (2 % 2) { A(); } else { B(); }',
    errors: [{ messageId: 'constantCondition' }],
    output: 'B();'
  },
  // String equality
  {
    code: "if ('a' + 'b' === 'ab') { A(); } else { B(); }",
    errors: [{ messageId: 'constantCondition' }],
    output: 'A();'
  }
];

const invalidBasicTests = [
    // Constant conditions
    {
      code: 'if (true) { doSomething(); }',
      errors: [{ messageId: 'constantCondition' }],
      output: 'doSomething();',
    },
    {
      code: 'if (false) { unreachable(); }',
      errors: [{ messageId: 'constantCondition' }],
      output: '',
    },
    // Else-clause optimization
    {
      code: 'if (true) { A(); } else { B(); }',
      errors: [{ messageId: 'constantCondition' }],
      output: 'A();',
    },
    {
      code: 'if (false) { A(); } else { B(); }',
      errors: [{ messageId: 'constantCondition' }],
      output: 'B();',
    },
    {
      code: 'if (false) A(); else B();',
      errors: [{ messageId: 'constantCondition' }],
      output: 'B();',
    },
    {
      code: 'if (true) A(); else B();',
      errors: [{ messageId: 'constantCondition' }],
      output: 'A();',
    },
    {
      code: 'if (false) { A1(); } else if (x) { B1(); }',
      errors: [{ messageId: 'constantCondition' }],
      output: 'if (x) { B1(); }',
    },
    {
      code: 'if (1) { doSomething(); }',
      errors: [{ messageId: 'constantCondition' }],
      output: 'doSomething();',
    },
    {
      code: 'if (0) { unreachable(); }',
      errors: [{ messageId: 'constantCondition' }],
      output: '',
    },
    {
      code: 'if ("") { unreachable(); }',
      errors: [{ messageId: 'constantCondition' }],
      output: '',
    },

    // Boolean comparisons - x === true
    {
      code: 'if (x === true) { }',
      errors: [{ messageId: 'redundantBoolean' }],
      output: 'if (x) { }',
    },
    {
      code: 'if (true === x) { }',
      errors: [{ messageId: 'redundantBoolean' }],
      output: 'if (x) { }',
    },
    {
      code: 'if (x == true) { }',
      errors: [{ messageId: 'redundantBoolean' }],
      output: 'if (x) { }',
    },

    // Boolean comparisons - x !== false
    {
      code: 'if (x !== false) { }',
      errors: [{ messageId: 'redundantBoolean' }],
      output: 'if (x) { }',
    },
    {
      code: 'if (false !== x) { }',
      errors: [{ messageId: 'redundantBoolean' }],
      output: 'if (x) { }',
    },

    // Boolean comparisons - x === false (negated)
    {
      code: 'if (x === false) { }',
      errors: [{ messageId: 'redundantBoolean' }],
      output: 'if (!x) { }',
    },
    {
      code: 'if (false === x) { }',
      errors: [{ messageId: 'redundantBoolean' }],
      output: 'if (!x) { }',
    },

    // Boolean comparisons - x !== true (negated)
    {
      code: 'if (x !== true) { }',
      errors: [{ messageId: 'redundantBoolean' }],
      output: 'if (!x) { }',
    },
    {
      code: 'if (true !== x) { }',
      errors: [{ messageId: 'redundantBoolean' }],
      output: 'if (!x) { }',
    },

    // Redundant ternaries - x ? true : false
    {
      code: 'const result = x ? true : false;',
      errors: [{ messageId: 'redundantTernary' }],
      output: 'const result = Boolean(x);',
    },
    {
      code: 'function test() { return condition ? true : false; }',
      errors: [{ messageId: 'redundantTernary' }],
      output: 'function test() { return Boolean(condition); }',
    },

    // Redundant ternaries - x ? false : true
    {
      code: 'const result = x ? false : true;',
      errors: [{ messageId: 'redundantTernary' }],
      output: 'const result = !x;',
    },
    {
      code: 'function test() { return condition ? false : true; }',
      errors: [{ messageId: 'redundantTernary' }],
      output: 'function test() { return !condition; }',
    },

    // Redundant ternaries - identical branches
    {
      code: 'const result = x ? value : value;',
      errors: [{ messageId: 'redundantTernary' }],
      output: 'const result = value;',
    },
    {
      code: 'function test() { return test ? fn() : fn(); }',
      errors: [{ messageId: 'redundantTernary' }],
      output: 'function test() { return fn(); }',
    },
    {
      code: 'const x = condition ? obj.prop : obj.prop;',
      errors: [{ messageId: 'redundantTernary' }],
      output: 'const x = obj.prop;',
    },

    // Loop support - WhileStatement
    {
      code: 'while (false) { unreachable(); }',
      errors: [{ messageId: 'constantCondition' }],
      output: ''
    },
    {
      code: 'while (true) { work(); }',
      errors: [{ messageId: 'constantCondition' }],
    },
    {
      code: 'while (+0) { unreachable(); }',
      errors: [{ messageId: 'constantCondition' }],
      output: ''
    },
    {
      code: 'while ([]) { work(); }',
      errors: [{ messageId: 'constantCondition' }],
    },

    // Loop support - ForStatement
    {
      code: 'for (;;) { work(); }',
      errors: [{ messageId: 'constantCondition' }],
    },
    {
      code: 'for (; false; ) { unreachable(); }',
      errors: [{ messageId: 'constantCondition' }],
      output: ''
    },

    // Loop support - DoWhileStatement
    {
      code: 'do { once(); } while (false);',
      errors: [{ messageId: 'constantCondition' }],
      output: 'once();'
    },
];

// Switch constant discriminants
const invalidSwitchConstants = [
  // Matching case with break → inline body
  {
    code: 'switch (1) { case 1: A(); break; case 2: B(); break; }',
    errors: [{ messageId: 'redundantSwitch' }],
    output: 'A();'
  },
  // Default with break → inline default
  {
    code: 'switch (3) { case 1: A(); break; default: C(); break; }',
    errors: [{ messageId: 'redundantSwitch' }],
    output: 'C();'
  },
  // No match, no default → remove switch
  {
    code: 'switch (3) { case 1: A(); break; case 2: B(); break; }',
    errors: [{ messageId: 'redundantSwitch' }],
    output: ''
  },
  // Not safe: matching case without break and more cases → report only
  {
    code: 'switch (1) { case 1: A(); case 2: B(); break; }',
    errors: [{ messageId: 'redundantSwitch' }],
  },
  // Default without break followed by cases → report only
  {
    code: 'switch (0) { default: C(); case 1: D(); break; }',
    errors: [{ messageId: 'redundantSwitch' }],
  },
  // Last matching case without break (safe: last case)
  {
    code: 'switch (1) { case 1: A(); }',
    errors: [{ messageId: 'redundantSwitch' }],
    output: 'A();'
  },
  // Last default without break (safe: last case)
  {
    code: 'switch (0) { default: C(); }',
    errors: [{ messageId: 'redundantSwitch' }],
    output: 'C();'
  },
  // Empty switch → remove
  {
    code: 'switch (1) { }',
    errors: [{ messageId: 'redundantSwitch' }],
    output: ''
  },
  // Terminal statements (return/throw) are safe
  {
    code: 'function f(){ switch (1) { case 1: return A(); break; default: return B(); } }',
    errors: [{ messageId: 'redundantSwitch' }],
    output: 'function f(){ return A(); }'
  },
  {
    code: 'function f(){ switch (2) { default: throw err; } }',
    errors: [{ messageId: 'redundantSwitch' }],
    output: 'function f(){ throw err; }'
  },
  {
    code: 'function f(){ switch (2) { default: C(); break; } }',
    errors: [{ messageId: 'redundantSwitch' }],
    output: 'function f(){ C(); }'
  },
  // Continue in loop: matching case with continue
  {
    code: 'for (let i=0;i<1;i++){ switch (1) { case 1: continue; } }',
    errors: [{ messageId: 'redundantSwitch' }],
    output: 'for (let i=0;i<1;i++){ continue; }'
  },
  // Continue in loop: default with continue
  {
    code: 'while (cond) { switch (0) { default: continue; } }',
    errors: [{ messageId: 'redundantSwitch' }],
    output: 'while (cond) { continue; }'
  },
];

// Multi-instance: multiple constant conditions in one block
const invalidMultiInstance = [
  {
    code: `
if (true) A();
if (false) B();
if (1) C();
`,
    errors: [
      { messageId: 'constantCondition' },
      { messageId: 'constantCondition' },
      { messageId: 'constantCondition' }
    ],
    output: `
A();

C();
`
  }
];

//------------------------------------------------------------------------------
// Run All Tests
//------------------------------------------------------------------------------

ruleTester.run("no-redundant-conditionals", rule, {
  valid: [
    ...validBasicTests,
    ...validFalsyValues,
    ...validComplexTernaries,
    ...validNestedConditionals,
    ...validLogicalExpressions
  ],
  invalid: [
    ...invalidBasicTests,
    ...invalidFalsyValues,
    ...invalidTruthyValues,
    ...invalidComplexTernaries,
    ...invalidCoverageGaps,
    ...invalidConstantFolding,
    ...invalidSwitchConstants,
    ...invalidMultiInstance
  ]
});
