/**
 * @fileoverview Detect if/else branches that do the same thing
 * @author mojoatomic
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/no-equivalent-branches"),
  RuleTester = require("eslint").RuleTester;


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
    // No else branch
    { code: 'if (x) { foo(); }' },
    { code: 'function test() { if (condition) return 1; }' },
    
    // Different branches
    { code: 'function test() { if (x) { return 1; } else { return 2; } }' },
    { code: 'if (x) { foo(); } else { bar(); }' },
    { code: 'if (x) { a = 1; } else { a = 2; }' },
    { code: 'if (x) { console.log("a"); } else { console.log("b"); }' },
    
    // else if (skip these)
    { code: 'function test() { if (x) { return 1; } else if (y) { return 1; } }' },
    { code: 'if (x) { foo(); } else if (y) { foo(); } else { bar(); }' },
    
    // Different number of statements
    { code: 'if (x) { foo(); bar(); } else { foo(); }' },
    { code: 'if (x) { foo(); } else { foo(); bar(); }' },
    
    // Different arguments
    { code: 'if (x) { foo(1); } else { foo(2); }' },
    { code: 'if (x) { obj.method(a); } else { obj.method(b); }' },
    
    // Different objects/properties
    { code: 'function test() { if (x) { return obj1.prop; } else { return obj2.prop; } }' },
    { code: 'function test() { if (x) { return obj.prop1; } else { return obj.prop2; } }' },
    
    // Different operators
    { code: 'function test() { if (x) { return a + b; } else { return a - b; } }' },
    { code: 'function test() { if (x) { return a && b; } else { return a || b; } }' },
];

//------------------------------------------------------------------------------
// Phase 1: Critical Edge Cases
//------------------------------------------------------------------------------

// Falsy Value Comparisons - JavaScript has 6 falsy values with different semantics
const validFalsyValues = [
  // null vs undefined (different values)
  { code: 'function test() { if (x) { return null; } else { return undefined; } }' },
  { code: 'function test() { if (x) { return undefined; } else { return null; } }' },
  
  // 0 vs -0 (different in Object.is)
  { code: 'function test() { if (x) { return 0; } else { return -0; } }' },
  
  // false vs 0 (different types)
  { code: 'function test() { if (x) { return false; } else { return 0; } }' },
  { code: 'function test() { if (x) { return 0; } else { return false; } }' },
  
  // "" vs 0 (different types)
  { code: 'function test() { if (x) { return ""; } else { return 0; } }' },
  { code: 'function test() { if (x) { return 0; } else { return ""; } }' },
  
  // null vs 0 (different types)
  { code: 'function test() { if (x) { return null; } else { return 0; } }' },
  
  // undefined vs 0 (different types)
  { code: 'function test() { if (x) { return undefined; } else { return 0; } }' },
];

// Object/Array References - Different object instances are not equivalent
const validObjectReferences = [
  // Object literals (different references)
  { code: 'function test() { if (x) { return {}; } else { return {}; } }' },
  { code: 'function test() { if (x) { return {a: 1}; } else { return {a: 1}; } }' },
  
  // Array literals (different references)
  { code: 'function test() { if (x) { return []; } else { return []; } }' },
  { code: 'function test() { if (x) { return [1]; } else { return [1]; } }' },
  
  // Function expressions (different references)
  { code: 'function test() { if (x) { return function() {}; } else { return function() {}; } }' },
  { code: 'function test() { if (x) { return () => {}; } else { return () => {}; } }' },
  
  // new Object() calls (different instances)
  { code: 'function test() { if (x) { return new Date(); } else { return new Date(); } }' },
  { code: 'function test() { if (x) { return new Error("msg"); } else { return new Error("msg"); } }' },
];

// Side Effects - Structurally equivalent but may have semantic side effects
// NOTE: Rule detects structural equivalence; users responsible for side effect analysis
const invalidSideEffects = [
  // Function calls (structurally equivalent, may have side effects)
  {
    code: 'function test() { if (x) { return fetch(); } else { return fetch(); } }',
    errors: [{ messageId: 'equivalentBranches' }],
    output: 'function test() { return fetch(); }'
  },
  {
    code: 'if (x) { console.log("test"); } else { console.log("test"); }',
    errors: [{ messageId: 'equivalentBranches' }],
    output: 'console.log("test");'
  },
  {
    code: 'if (x) { arr.push(1); } else { arr.push(1); }',
    errors: [{ messageId: 'equivalentBranches' }],
    output: 'arr.push(1);'
  },
];

// Update Expressions - Different AST node type
const validUpdateExpressions = [
  // Increment/decrement (UpdateExpression, not implemented yet)
  { code: 'if (x) { count++; } else { count++; }' },
];

// Special Values - NaN, Infinity, etc.
const validSpecialValues = [
  // NaN (NaN !== NaN)
  { code: 'function test() { if (x) { return NaN; } else { return 0/0; } }' },
  
  // Infinity variants
  { code: 'function test() { if (x) { return Infinity; } else { return -Infinity; } }' },
  { code: 'function test() { if (x) { return 1/0; } else { return -1/0; } }' },
];

// Template Literals vs Strings
const validTemplates = [
  // Template literal vs string (different if expressions differ)
  { code: 'function test() { if (x) { return `hello ${a}`; } else { return `hello ${b}`; } }' },
  { code: 'function test() { if (x) { return `test`; } else { return "test"; } }' }, // Technically same
];

const invalidBasicTests = [
    // Simple return statements
    {
      code: 'function test() { if (x) { return foo(); } else { return foo(); } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return foo(); }'
    },
    {
      code: 'function test() { if (condition) { return 1; } else { return 1; } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return 1; }'
    },
    {
      code: 'function test() { if (x) { return true; } else { return true; } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return true; }'
    },
    
    // Function calls
    {
      code: 'if (x) { foo(); } else { foo(); }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'foo();'
    },
    {
      code: 'if (condition) { doSomething(); } else { doSomething(); }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'doSomething();'
    },
    
    // Assignment statements
    {
      code: 'if (x) { a = 1; } else { a = 1; }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'a = 1;'
    },
    {
      code: 'if (x) { result = calculate(); } else { result = calculate(); }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'result = calculate();'
    },
    
    // Method calls
    {
      code: 'if (x) { obj.method(); } else { obj.method(); }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'obj.method();'
    },
    {
      code: 'function test() { if (x) { return data.process(); } else { return data.process(); } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return data.process(); }'
    },
    
    // Multiple statements (identical)
    {
      code: 'if (x) { foo(); bar(); } else { foo(); bar(); }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'foo(); bar();'
    },
    {
      code: 'function test() { if (x) { const a = 1; return a; } else { const a = 1; return a; } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { const a = 1; return a; }'
    },
    
    // With arguments
    {
      code: 'if (x) { foo(1, 2); } else { foo(1, 2); }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'foo(1, 2);'
    },
    {
      code: 'function test() { if (x) { return calculate(a, b); } else { return calculate(a, b); } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return calculate(a, b); }'
    },
    
    // Binary expressions
    {
      code: 'function test() { if (x) { return a + b; } else { return a + b; } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return a + b; }'
    },
    {
      code: 'function test() { if (x) { return a * 2; } else { return a * 2; } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return a * 2; }'
    },
    
    // Logical expressions
    {
      code: 'function test() { if (x) { return a && b; } else { return a && b; } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return a && b; }'
    },
    {
      code: 'function test() { if (x) { return a || b; } else { return a || b; } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return a || b; }'
    },
    
    // Unary expressions
    {
      code: 'function test() { if (x) { return !value; } else { return !value; } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return !value; }'
    },
    {
      code: 'function test() { if (x) { return -num; } else { return -num; } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return -num; }'
    },
    
    // Member expressions
    {
      code: 'function test() { if (x) { return obj.prop; } else { return obj.prop; } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return obj.prop; }'
    },
    {
      code: 'function test() { if (x) { return data.items[0]; } else { return data.items[0]; } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return data.items[0]; }'
    },
    
    // Without block statements (single statements)
    {
      code: 'function test() { if (x) return foo(); else return foo(); }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return foo(); }'
    },
    {
      code: 'if (condition) foo(); else foo();',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'foo();'
    },
    
    // Complex nested expressions
    {
      code: 'function test() { if (x) { return foo(bar(baz())); } else { return foo(bar(baz())); } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return foo(bar(baz())); }'
    },
    {
      code: 'function test() { if (x) { return obj.method().prop; } else { return obj.method().prop; } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return obj.method().prop; }'
    },
    
    // Literals
    {
      code: 'function test() { if (x) { return "same"; } else { return "same"; } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return "same"; }'
    },
    {
      code: 'function test() { if (x) { return 42; } else { return 42; } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return 42; }'
    },
    {
      code: 'function test() { if (x) { return null; } else { return null; } }',
      errors: [{ messageId: 'equivalentBranches' }],
      output: 'function test() { return null; }'
    },
];

// Multi-instance: multiple independent if/else blocks in one file
const invalidMultiInstance = [
  {
    code: `
if (a) { fn(); } else { fn(); }
if (b) { fn(); } else { fn(); }
if (c) { fn(); } else { fn(); }
`,
    errors: Array(3).fill({ messageId: 'equivalentBranches' }),
    output: `
fn();
fn();
fn();
`
  }
];

//------------------------------------------------------------------------------
// Run All Tests
//------------------------------------------------------------------------------

ruleTester.run("no-equivalent-branches", rule, {
  valid: [
    ...validBasicTests,
    ...validFalsyValues,
    ...validObjectReferences,
    ...validUpdateExpressions,
    ...validSpecialValues,
    ...validTemplates
  ],
  invalid: [
    ...invalidBasicTests,
    ...invalidSideEffects,
    ...invalidMultiInstance
  ]
});
