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

//------------------------------------------------------------------------------
// Basic Functionality Tests
//------------------------------------------------------------------------------

const validBasicTests = [
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
];

const invalidBasicTests = [
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
    errors: [{ messageId: 'ambiguousConstant' }]
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
];

//------------------------------------------------------------------------------
// Phase 1: Critical Edge Cases
//------------------------------------------------------------------------------

// Numeric Boundaries - Tests JavaScript's numeric edge cases
const validNumericBoundaries = [
  // BigInt literals must NOT be fixed (different type semantics)
  { code: 'const x = 1n + 2n;' }, // BigInt !== Number
  { code: 'const x = BigInt(1) + BigInt(2);' }, // BigInt constructor
  { code: 'const x = 1n * 2n * 3n;' }, // BigInt chain
];

const invalidNumericBoundaries = [
  // Floating point precision (JavaScript reality)
  {
    code: 'const x = 0.1 + 0.2;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 0.3;' // Smart rounded
  },
  // Division by zero
  {
    code: 'const x = 5 / 0;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = Infinity;'
  },
  // NaN results
  {
    code: 'const x = 0 / 0;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = NaN;'
  },
  // MAX_SAFE_INTEGER boundary
  {
    code: 'const x = 9007199254740991 + 1;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 9007199254740992;' // Exceeds MAX_SAFE_INTEGER
  },
  // Negative zero
  {
    code: 'const x = -0 + 0;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 0;'
  },
  // Negative numbers
  {
    code: 'const x = -5 + -3;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = -8;'
  },
  // Very large numbers
  {
    code: 'const x = 1e10 * 2;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 2e+10;'
  },
  // Very small numbers
  {
    code: 'const x = 1e-7 + 2e-7;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 3e-7;'
  }
];

// Operator Precedence - Correctness is non-negotiable
const invalidOperatorPrecedence = [
  // Mixed operators (multiplication before addition)
  {
    code: 'const x = 2 + 3 * 4;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 14;' // NOT 20!
  },
  {
    code: 'const x = 10 - 2 * 3;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 4;' // 10 - 6, not 8 * 3
  },
  // Exponentiation has highest precedence
  {
    code: 'const x = 2 ** 3 * 4;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 32;' // 8 * 4
  },
  // Deeply nested with parentheses
  {
    code: 'const x = ((1 + 2) * (3 + 4)) / 5;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 4.2;' // (3 * 7) / 5
  },
  // Multiple operations with floating point precision
  {
    code: 'const x = 1 + 2 - 3 * 4 / 5;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 0.6;' // Smart rounded
  },
  // Modulo with addition
  {
    code: 'const x = 10 % 3 + 2 * 4;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 9;' // 1 + 8
  }
];

// False Positives - Should NOT trigger rule
const validFalsePositives = [
  // Template literals (expressions must stay dynamic)
  { code: '`Total: ${1 + 2}`;' },
  { code: 'const msg = `Sum: ${a + b}`;' },
  // String concatenation (not numeric)
  { code: 'const x = "1" + "2";' }, // "12", not 3
  { code: 'const x = "hello" + "world";' },
  // Variables in calculations
  { code: 'const one = 1; const x = one + 2;' },
  { code: 'const x = value + 1 + 2;' }, // value is variable
  // Bitwise operators (different semantics)
  { code: 'const x = 5 | 3;' }, // Bitwise OR
  { code: 'const x = 8 >> 2;' }, // Right shift
  { code: 'const x = ~5;' }, // Bitwise NOT
  { code: 'const x = 5 & 3;' }, // Bitwise AND
  // Comparisons (boolean result)
  { code: 'if (1 + 2 > x) {}' },
  { code: 'const isValid = a + b === 10;' },
  // Dynamic property access
  { code: 'const x = obj[1 + 2];' }, // Computed property
  { code: 'arr[index + 1]' }
];

// Modern JavaScript - Different number representations
const validModernJS = [
  // Empty - numeric separators are parsed away by JavaScript
];

// Branch Coverage - Tests for uncovered code paths
const invalidBranchCoverage = [
  // Unary plus operator (line 77) - forces + branch
  {
    code: 'const x = +5 + +3;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 8;'
  },
  // Mixed unary operators
  {
    code: 'const x = +10 - -5;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 15;'
  }
];

// Edge Case Coverage - Expression types that return null
const validEdgeCoverage = [
  // Unsupported unary operators (line 79) - forces default case
  { code: 'const x = !true + 1;' }, // ! operator not supported
  { code: 'const x = typeof 5 + 1;' }, // typeof not supported
  { code: 'const x = ~5 + 1;' }, // bitwise NOT not supported
  // Mixed expression types that cause null evaluation (lines 88-89)
  { code: 'const x = (function(){}) + 1;' }, // Function expression
  { code: 'const x = [] + 1;' }, // Array literal
  { code: 'const x = {} + 1;' }, // Object literal
  // Non-expression nodes (lines 108-109)
  { code: 'const x = arguments + 1;' }, // Identifier
  { code: 'const x = this + 1;' } // ThisExpression
];

const invalidModernJS = [
  // Numeric separators (parsed as regular numbers by JS)
  {
    code: 'const x = 1_000 + 2_000;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 3000;' // Separators are lost in parsing
  },
  // Hexadecimal
  {
    code: 'const x = 0xFF + 0x10;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 271;' // 255 + 16
  },
  // Octal
  {
    code: 'const x = 0o77 + 0o10;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 71;' // 63 + 8
  },
  // Binary
  {
    code: 'const x = 0b1111 + 0b0001;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 16;' // 15 + 1
  },
  // Scientific notation
  {
    code: 'const x = 1e6 + 2e6;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 3e+6;'
  },
  // Mixed bases
  {
    code: 'const x = 0xFF + 0o77 + 0b1111;',
    errors: [{ messageId: 'redundantCalculation' }],
    output: 'const x = 333;' // 255 + 63 + 15
  }
];

// Multi-instance: multiple top-level constant calculations in one file
const invalidMultiInstance = [
  {
    code: `
const a = 1 + 2;
const b = 3 + 4;
const c = 5 + 6;
const d = 7 + 8;
const e = 9 + 10;
`,
    errors: Array(5).fill({ messageId: 'redundantCalculation' }),
    output: `
const a = 3;
const b = 7;
const c = 11;
const d = 15;
const e = 19;
`
  }
];

// Multi-instance (mixed contexts): array/object literals and function args in one block
// v1.1.1: Valid scientific/unit formulas that should be skipped
const validV111Additions = [
  { code: 'const mm = 2 * 25.4;' },
  { code: 'const cm = 1 * 2.54;' },
  { code: 'const feetToMeters = 3 * 0.3048;' },
  { code: 'const weekMs = 7 * 86400e3;' },
  // Music, strong context via variable name
  { code: 'const frequency = 440 * 2;' },
];

const invalidMultiInstanceMixed = [
  {
    code: `
const arr = [1 + 2, 3 + 4, 5 - 5];
const obj = { a: 6 * 7, b: 8 / 2, c: 9 % 4 };
doSomething(1 + 1, 2 * 3, 4 - 1);
`,
    errors: Array(9).fill({ messageId: 'redundantCalculation' }),
    output: `
const arr = [3, 7, 0];
const obj = { a: 42, b: 4, c: 1 };
doSomething(2, 6, 3);
`
  }
];

// Scientific formulas that should be skipped (no report)
const validScientificFormulas = [
  // High precision results
  { code: 'const meanMotion = 360 / 365.25;' },
  { code: 'const nodeMotionPerDay = -19.3416 / 365.25;' },
  { code: 'const daysPerSaros = 223 * 29.53059;' },

  // Physical constants present in expression
  { code: 'const yearMs = 365.25 * 24 * 3600 * 1000;' },
  { code: 'const centuryMs = 100 * 365.25 * 24 * 3600 * 1000;' },

  // Scientific variable names in owning identifier
  { code: 'const meanLongitude = 1 + 2;' },
  { code: 'const orbitalPeriod = 3 * 4;' },
  { code: 'const nodeMotion = 5 / 6;' },

];

//------------------------------------------------------------------------------
// Run All Tests
//------------------------------------------------------------------------------

ruleTester.run("no-redundant-calculations", rule, {
  valid: [
    ...validBasicTests,
    ...validNumericBoundaries,
    ...validFalsePositives,
    ...validModernJS,
    ...validEdgeCoverage,
    ...validScientificFormulas,
    ...validV111Additions
  ],
  invalid: [
    ...invalidBasicTests,
    ...invalidNumericBoundaries,
    ...invalidOperatorPrecedence,
    ...invalidModernJS,
    ...invalidBranchCoverage,
    ...invalidMultiInstance,
    ...invalidMultiInstanceMixed
  ]
});
