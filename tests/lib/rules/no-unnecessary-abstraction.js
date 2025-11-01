/**
 * @fileoverview Suggest inlining trivial single-use wrapper functions that add no value
 * @author mojoatomic
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/no-unnecessary-abstraction"),
  RuleTester = require("eslint").RuleTester;


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({ languageOptions: { ecmaVersion: 2015 } });
ruleTester.run("no-unnecessary-abstraction", rule, {
  valid: [
    // Function used multiple times - not a wrapper issue
    {
      code: `
function helper(x) { return x * 2; }
helper(5);
helper(10);
      `,
    },

    // Function with additional logic - not trivial
    {
      code: `
function calculateTax(amount) {
  console.log('Calculating tax');
  return getTax(amount);
}
function getTax(amount) { return amount * 0.08; }
calculateTax(100);
      `,
    },

    // Function with multiple statements - not trivial
    {
      code: `
function wrapper(x) {
  const result = compute(x);
  return result;
}
function compute(x) { return x * 2; }
wrapper(5);
      `,
    },

    // Function transforms arguments - not pass-through
    {
      code: `
function wrapper(x) {
  return compute(x * 2);
}
function compute(x) { return x + 1; }
wrapper(5);
      `,
    },

    // Different number of parameters
    {
      code: `
function wrapper(x) {
  return compute(x, 10);
}
function compute(a, b) { return a + b; }
wrapper(5);
      `,
    },

    // Arguments in different order
    {
      code: `
function wrapper(a, b) {
  return compute(b, a);
}
function compute(x, y) { return x - y; }
wrapper(5, 3);
      `,
    },

    // Arrow function used multiple times
    {
      code: `
const double = (x) => x * 2;
double(5);
double(10);
      `,
    },

    // No return statement
    {
      code: `
function sideEffect(x) {
  console.log(x);
}
sideEffect(5);
      `,
    },

    // Returns non-call expression
    {
      code: `
function getValue() {
  return 42;
}
getValue();
      `,
    },

    // Function never called
    {
      code: `
function wrapper(x) {
  return compute(x);
}
function compute(x) { return x * 2; }
      `,
    },

    // Method call wrapper used multiple times
    {
      code: `
function wrapper(obj) {
  return obj.method();
}
const o = { method() { return 1; } };
wrapper(o);
wrapper(o);
      `,
    },

    // Destructured parameters - not simple identifiers
    {
      code: `
function wrapper({ x }) {
  return compute({ x });
}
function compute(obj) { return obj.x * 2; }
wrapper({ x: 5 });
      `,
    },

    // Rest parameters
    {
      code: `
function wrapper(...args) {
  return compute(...args);
}
function compute(a, b) { return a + b; }
wrapper(1, 2);
      `,
    },

    // Default parameters
    {
      code: `
function wrapper(x = 0) {
  return compute(x);
}
function compute(x) { return x * 2; }
wrapper();
      `,
    },

    // Expression body arrow (no block statement)
    {
      code: `
const wrapper = (x) => compute(x);
function compute(x) { return x * 2; }
wrapper(5);
      `,
    },

    // Method call wrapper - not a simple identifier callee
    {
      code: `
function getLength(arr) {
  return arr.length();
}
const a = { length() { return 5; } };
getLength(a);
      `,
    },

    // Chained method call wrapper - not a simple identifier callee
    {
      code: `
function process(obj) {
  return obj.data.transform();
}
const o = { data: { transform() { return 1; } } };
process(o);
      `,
    },
  ],

  invalid: [
    // Basic trivial wrapper - function declaration
    {
      code: `function calculateTax(amount) {
  return getTax(amount);
}
function getTax(amount) {
  return amount * 0.08;
}
calculateTax(100);`,
      errors: [{
        messageId: 'unnecessaryWrapper',
        data: { name: 'calculateTax', wrappedName: 'getTax' },
        suggestions: [{
          messageId: 'inlineFunction',
          output: `function getTax(amount) {
  return amount * 0.08;
}
calculateTax(100);`,
        }],
      }],
    },

    // Trivial wrapper - arrow function in variable
    {
      code: `const wrapper = (x) => {
  return compute(x);
};
function compute(x) { return x * 2; }
wrapper(5);`,
      errors: [{
        messageId: 'unnecessaryWrapper',
        data: { name: 'wrapper', wrappedName: 'compute' },
        suggestions: [{
          messageId: 'inlineFunction',
          output: `function compute(x) { return x * 2; }
wrapper(5);`,
        }],
      }],
    },

    // Multiple parameters
    {
      code: `function add(a, b) {
  return sum(a, b);
}
function sum(x, y) { return x + y; }
add(1, 2);`,
      errors: [{
        messageId: 'unnecessaryWrapper',
        data: { name: 'add', wrappedName: 'sum' },
        suggestions: [{
          messageId: 'inlineFunction',
          output: `function sum(x, y) { return x + y; }
add(1, 2);`,
        }],
      }],
    },

    // Zero parameters
    {
      code: `function getConfig() {
  return loadConfig();
}
function loadConfig() { return {}; }
getConfig();`,
      errors: [{
        messageId: 'unnecessaryWrapper',
        data: { name: 'getConfig', wrappedName: 'loadConfig' },
        suggestions: [{
          messageId: 'inlineFunction',
          output: `function loadConfig() { return {}; }
getConfig();`,
        }],
      }],
    },

    // Method call wrapper - removed (too complex for this rule)

    // Chained method call wrapper - removed (too complex for this rule)

    // Function expression assigned to variable
    {
      code: `const wrapper = function(x) {
  return helper(x);
};
function helper(x) { return x * 2; }
wrapper(5);`,
      errors: [{
        messageId: 'unnecessaryWrapper',
        data: { name: 'wrapper', wrappedName: 'helper' },
        suggestions: [{
          messageId: 'inlineFunction',
          output: `function helper(x) { return x * 2; }
wrapper(5);`,
        }],
      }],
    },

    // Single parameter with descriptive name
    {
      code: `function formatUser(user) {
  return display(user);
}
function display(obj) { return JSON.stringify(obj); }
formatUser({ name: 'Alice' });`,
      errors: [{
        messageId: 'unnecessaryWrapper',
        data: { name: 'formatUser', wrappedName: 'display' },
        suggestions: [{
          messageId: 'inlineFunction',
          output: `function display(obj) { return JSON.stringify(obj); }
formatUser({ name: 'Alice' });`,
        }],
      }],
    },
  ],
});
