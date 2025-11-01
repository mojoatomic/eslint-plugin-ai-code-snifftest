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

const ruleTester = new RuleTester({ languageOptions: { ecmaVersion: 2015 } });
ruleTester.run("no-redundant-conditionals", rule, {
  valid: [
    // Normal conditions
    'if (x) { doSomething(); }',
    'function test() { if (x > 5) { return true; } }',
    'if (condition && other) { }',
    
    // Variables (not constants)
    'if (value) { doWork(); }',
    'const result = x ? getValue() : getOther();',
    
    // Intentional infinite loops
    'while (true) { break; }',
    'for (;;) { work(); }',
    
    // Ternaries with different values
    'const x = condition ? 1 : 2;',
    'const y = test ? "yes" : "no";',
    
    // Number/string comparisons (not boolean)
    'if (x === 1) { }',
    'if (value === "true") { }',
  ],

  invalid: [
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
  ],
});
