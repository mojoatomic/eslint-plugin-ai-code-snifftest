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

const ruleTester = new RuleTester({ languageOptions: { ecmaVersion: 2021, sourceType: 'module' } });

//------------------------------------------------------------------------------
// Basic Functionality Tests
//------------------------------------------------------------------------------

const validBasicTests = [
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
];

//------------------------------------------------------------------------------
// Phase 1: Critical Edge Cases
//------------------------------------------------------------------------------

// Recursive Functions - Should NEVER be inlined
const validRecursive = [
  // Direct recursion
  {
    code: `
function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1);
}
factorial(5);
    `,
  },
  // Mutual recursion
  {
    code: `
function isEven(n) {
  return n === 0 ? true : isOdd(n - 1);
}
function isOdd(n) {
  return n === 0 ? false : isEven(n - 1);
}
isEven(4);
    `,
  },
];

// Closures - Functions capturing state from outer scope
const validClosures = [
  // Captures variable from outer scope
  {
    code: `
function makeCounter() {
  let count = 0;
  return function increment() {
    return ++count;
  };
}
const counter = makeCounter();
counter();
    `,
  },
  // Captures parameter from outer function
  {
    code: `
function multiplier(factor) {
  return function multiply(x) {
    return factor * x;
  };
}
const double = multiplier(2);
double(5);
    `,
  },
];

// This Binding - Functions that use 'this'
const validThisBinding = [
  // Method using 'this'
  {
    code: `
const obj = {
  value: 42,
  getValue() {
    return this.value;
  }
};
obj.getValue();
    `,
  },
  // Function with explicit this binding
  {
    code: `
function wrapper(x) {
  return this.compute(x);
}
const ctx = { compute(x) { return x * 2; } };
wrapper.call(ctx, 5);
    `,
  },
];

// Async/Generator Functions - Special function types
const validAsyncGenerator = [
  // Async function
  {
    code: `
async function fetchData(url) {
  return await fetch(url);
}
fetchData('https://api.example.com');
    `,
  },
  // Generator function
  {
    code: `
function* generate(n) {
  yield n;
  yield n + 1;
}
const gen = generate(1);
gen.next();
    `,
  },
  // Async generator
  {
    code: `
async function* asyncGen() {
  yield await Promise.resolve(1);
}
const ag = asyncGen();
ag.next();
    `,
  },
];

// IIFE Patterns - Immediately Invoked Function Expressions
const validIIFE = [
  // Classic IIFE
  {
    code: `
(function() {
  console.log('IIFE');
})();
    `,
  },
  // Arrow IIFE
  {
    code: `
(() => {
  return 42;
})();
    `,
  },
];

// Different Scopes - Functions called in different contexts
const validDifferentScopes = [
  // Function called in different scopes
  {
    code: `
function helper(x) { return x * 2; }
if (true) { helper(5); }
else { helper(10); }
    `,
  },
  // Function called in loop
  {
    code: `
function process(item) { return item.toUpperCase(); }
const items = ['a', 'b'];
for (const item of items) { process(item); }
    `,
  },
];

// Exported Functions - Public API should not trigger
const validExportedFunctions = [
  // Named export
  {
    code: `
export function wrapper(x) {
  return compute(x);
}
function compute(x) { return x * 2; }
wrapper(5);
    `,
  },
  // Default export
  {
    code: `
export default function wrapper(x) {
  return compute(x);
}
function compute(x) { return x * 2; }
wrapper(5);
    `,
  },
  // Export const (arrow)
  {
    code: `
export const wrapper = (x) => compute(x);
function compute(x) { return x * 2; }
wrapper(5);
    `,
  },
  // Export const (function expression) - should be skipped by rule (public API)
  {
    code: `
export const wrapper = function(x) {
  return compute(x);
};
function compute(x) { return x * 2; }
wrapper(5);
    `,
  },
];

// Side Effects - Functions with side effects should not be inlined
const validSideEffects = [
  // Console logging
  {
    code: `
function logAndCompute(x) {
  console.log('computing:', x);
  return compute(x);
}
function compute(x) { return x * 2; }
logAndCompute(5);
    `,
  },
  // State mutation
  {
    code: `
let counter = 0;
function trackAndCompute(x) {
  counter++;
  return compute(x);
}
function compute(x) { return x * 2; }
trackAndCompute(5);
    `,
  },
  // Multiple statements
  {
    code: `
function validate(x) {
  if (x < 0) throw new Error('negative');
  return compute(x);
}
function compute(x) { return x * 2; }
validate(5);
    `,
  },
];

// Hoisting Edge Cases - Function declarations vs expressions
const validHoisting = [
  // Called before declaration (hoisting)
  {
    code: `
helper(5);
function helper(x) { return x * 2; }
    `,
  },
  // Function expression not hoisted
  {
    code: `
const helper = function(x) { return x * 2; };
helper(5);
helper(10);
    `,
  },
];

// Special Arguments - arguments object, new.target
const validSpecialArguments = [
  // Uses arguments object
  {
    code: `
function wrapper() {
  return compute(arguments[0]);
}
function compute(x) { return x * 2; }
wrapper(5);
    `,
  },
  // Uses new.target
  {
    code: `
function Wrapper(x) {
  if (!new.target) throw new Error('use new');
  return compute(x);
}
function compute(x) { return x * 2; }
new Wrapper(5);
    `,
  },
];

// Function Properties - Functions used as objects
const validFunctionProperties = [
  // Function has properties attached
  {
    code: `
function wrapper(x) { return compute(x); }
wrapper.version = '1.0';
function compute(x) { return x * 2; }
wrapper(5);
    `,
  },
  // Function passed as callback
  {
    code: `
function wrapper(x) { return compute(x); }
function compute(x) { return x * 2; }
[1, 2, 3].map(wrapper);
    `,
  },
];

// Conditional/Try-Catch Wrappers - Error handling
const validErrorHandling = [
  // Try-catch wrapper
  {
    code: `
function safeCompute(x) {
  try {
    return compute(x);
  } catch (e) {
    return 0;
  }
}
function compute(x) { return x * 2; }
safeCompute(5);
    `,
  },
  // Conditional wrapper
  {
    code: `
function conditionalCompute(x) {
  return x > 0 ? compute(x) : 0;
}
function compute(x) { return x * 2; }
conditionalCompute(5);
    `,
  },
];

// Name Collisions - Same parameter names, different semantics
const validNameCollisions = [
  // Parameter shadows outer variable (used multiple times)
  {
    code: `
const x = 10;
function wrapper(x) {
  return compute(x);
}
function compute(x) { return x * 2; }
wrapper(5);
wrapper(10);
    `,
  },
  // Wrapper provides semantic clarity
  {
    code: `
function calculateTotalPrice(price) {
  return addTax(price);
}
function addTax(amount) { return amount * 1.08; }
calculateTotalPrice(100);
calculateTotalPrice(200);
    `,
  },
];

const invalidBasicTests = [
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
];

// Fixer Whitespace/Suggestion Output - Validate fixer trimming behavior
const invalidFixerWhitespace = [
  // 1) Same-line preceding code: left-trim eats preceding space; newline after wrapper is removed
  {
    code: `const a = 1; function wrapper(x) { return compute(x); }\nfunction compute(x) { return x * 2; }\nwrapper(5);`,
    errors: [{
      messageId: 'unnecessaryWrapper',
      data: { name: 'wrapper', wrappedName: 'compute' },
      suggestions: [{
        messageId: 'inlineFunction',
        // Note: space before function is removed; newline after wrapper is removed
        output: `const a = 1;function compute(x) { return x * 2; }\nwrapper(5);`
      }]
    }],
  },
  // 2) Trailing spaces + newline after wrapper: right-trim eats spaces and one newline
  {
    code: `function wrapper(x) { return compute(x); }    \nfunction compute(x) { return x * 2; }\nwrapper(5);`,
    errors: [{
      messageId: 'unnecessaryWrapper',
      data: { name: 'wrapper', wrappedName: 'compute' },
      suggestions: [{
        messageId: 'inlineFunction',
        output: `function compute(x) { return x * 2; }\nwrapper(5);`
      }]
    }],
  },
  // 3) Clean case: function at start of line
  {
    code: `function wrapper(x) { return compute(x); }\nfunction compute(x) { return x * 2; }\nwrapper(5);`,
    errors: [{
      messageId: 'unnecessaryWrapper',
      data: { name: 'wrapper', wrappedName: 'compute' },
      suggestions: [{
        messageId: 'inlineFunction',
        output: `function compute(x) { return x * 2; }\nwrapper(5);`
      }]
    }],
  },
  // 4) Next token on same line (no newline): right-trim eats spaces but not next token
  {
    code: `function wrapper(x) { return compute(x); }   console.log('x');\nfunction compute(x) { return x * 2; }\nwrapper(5);`,
    errors: [{
      messageId: 'unnecessaryWrapper',
      data: { name: 'wrapper', wrappedName: 'compute' },
      suggestions: [{
        messageId: 'inlineFunction',
        output: `console.log('x');\nfunction compute(x) { return x * 2; }\nwrapper(5);`
      }]
    }],
  },
  // 5) CRLF handling: trailing CRLF is removed as a single newline by the fixer loop
  {
    code: "function wrapper(x) { return compute(x); }\r\nfunction compute(x) { return x * 2; }\nwrapper(5);",
    errors: [{
      messageId: 'unnecessaryWrapper',
      data: { name: 'wrapper', wrappedName: 'compute' },
      suggestions: [{
        messageId: 'inlineFunction',
        output: `function compute(x) { return x * 2; }\nwrapper(5);`
      }]
    }],
  },
];

// Multi-instance: multiple trivial wrappers in one file (suggestions only)
const invalidMultiInstance = [
  {
    code: `
function w1(x) { return compute(x); }
function w2(y) { return compute(y); }
function compute(z) { return z * 2; }
w1(1); w2(2);
`,
    errors: [
      {
        messageId: 'unnecessaryWrapper',
        data: { name: 'w1', wrappedName: 'compute' },
        suggestions: [{
          messageId: 'inlineFunction',
          output: `
function w2(y) { return compute(y); }
function compute(z) { return z * 2; }
w1(1); w2(2);
`
        }]
      },
      {
        messageId: 'unnecessaryWrapper',
        data: { name: 'w2', wrappedName: 'compute' },
        suggestions: [{
          messageId: 'inlineFunction',
          output: `
function w1(x) { return compute(x); }
function compute(z) { return z * 2; }
w1(1); w2(2);
`
        }]
      }
    ]
  }
];

//------------------------------------------------------------------------------
// Run All Tests
//------------------------------------------------------------------------------

ruleTester.run("no-unnecessary-abstraction", rule, {
  valid: [
    ...validBasicTests,
    ...validRecursive,
    ...validClosures,
    ...validThisBinding,
    ...validAsyncGenerator,
    ...validIIFE,
    ...validDifferentScopes,
    ...validExportedFunctions,
    ...validSideEffects,
    ...validHoisting,
    ...validSpecialArguments,
    ...validFunctionProperties,
    ...validErrorHandling,
    ...validNameCollisions
  ],
  invalid: [
    ...invalidBasicTests,
    ...invalidFixerWhitespace,
    ...invalidMultiInstance
  ]
});
