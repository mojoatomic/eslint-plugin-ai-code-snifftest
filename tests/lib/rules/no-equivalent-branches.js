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

ruleTester.run("no-equivalent-branches", rule, {
  valid: [
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
  ],

  invalid: [
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
  ],
});
