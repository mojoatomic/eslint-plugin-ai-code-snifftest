/**
 * @fileoverview Prettier Compatibility Integration Tests
 * Verifies that ESLint auto-fixes work seamlessly with Prettier formatting
 */
'use strict';

/* global describe, it */

const { ESLint } = require('eslint');
const prettier = require('prettier');
const assert = require('assert');

/**
 * Test helper: Apply ESLint fixes then Prettier formatting
 */
async function testPrettierCompat(code, expectedFixed) {
  // Step 1: ESLint auto-fix
  const plugin = require('../../lib/index.js');
  
  const eslint = new ESLint({ 
    fix: true,
    overrideConfigFile: true,
    overrideConfig: [
      {
        plugins: {
          'ai-code-snifftest': plugin,
        },
        rules: {
          'ai-code-snifftest/no-redundant-calculations': 'error',
          'ai-code-snifftest/no-equivalent-branches': 'error',
          'ai-code-snifftest/prefer-simpler-logic': 'error',
          'ai-code-snifftest/no-redundant-conditionals': 'error',
        },
      },
    ],
  });
  
  const results = await eslint.lintText(code);
  const fixed = results[0].output || code;
  
  // Step 2: Prettier format
  const formatted = await prettier.format(fixed, { 
    parser: 'babel',
    semi: true,
    singleQuote: true,
  });
  
  // Step 3: Verify result matches expected
  assert.strictEqual(formatted.trim(), expectedFixed.trim(), 
    `Expected:\n${expectedFixed}\n\nGot:\n${formatted}`);
  
  // Step 4: Verify idempotency (running ESLint again should not error)
  const results2 = await eslint.lintText(formatted);
  assert.strictEqual(results2[0].errorCount, 0, 
    'ESLint should not error after Prettier formatting');
}

/**
 * Test idempotency: multiple passes should be stable
 */
async function testIdempotency(code) {
  const plugin = require('../../lib/index.js');
  
  const eslint = new ESLint({ 
    fix: true,
    overrideConfigFile: true,
    overrideConfig: [
      {
        plugins: {
          'ai-code-snifftest': plugin,
        },
        rules: {
          'ai-code-snifftest/no-redundant-calculations': 'error',
          'ai-code-snifftest/no-equivalent-branches': 'error',
          'ai-code-snifftest/prefer-simpler-logic': 'error',
          'ai-code-snifftest/no-redundant-conditionals': 'error',
        },
      },
    ],
  });
  
  // First pass
  const results1 = await eslint.lintText(code);
  const fixed1 = results1[0].output || code;
  
  // Second pass
  const results2 = await eslint.lintText(fixed1);
  const fixed2 = results2[0].output || fixed1;
  
  // Should be stable
  assert.strictEqual(fixed1, fixed2, 'ESLint fixes should be idempotent');
  assert.strictEqual(results2[0].errorCount, 0, 'No errors after second pass');
}

describe('Prettier Compatibility Integration Tests', function() {
  // Increase timeout for async operations
  this.timeout(5000);

  describe('Rule 1: no-redundant-calculations', () => {
    it('should work with no spacing', async () => {
      await testPrettierCompat(
        'const x=1+2+3;',
        'const x = 6;'
      );
    });

    it('should work with normal spacing', async () => {
      await testPrettierCompat(
        'const x = 1 + 2 + 3;',
        'const x = 6;'
      );
    });

    it('should work with inconsistent spacing', async () => {
      await testPrettierCompat(
        'const x=1 +2+ 3;',
        'const x = 6;'
      );
    });

    it('should work with nested calculations', async () => {
      await testPrettierCompat(
        'const x=(1+2)*(3+4);',
        'const x = 21;'
      );
    });

    it('should work with multiple calculations', async () => {
      await testPrettierCompat(
        'const x=1+2,y=3+4;',
        'const x = 3,\n  y = 7;'
      );
    });
  });

  describe('Rule 2: no-equivalent-branches', () => {
    it('should work with compact formatting', async () => {
      await testPrettierCompat(
        'function test() { if (x) { return 1; } else { return 1; } }',
        'function test() {\n  return 1;\n}'
      );
    });

    it('should work with expanded formatting', async () => {
      await testPrettierCompat(
        'function test() {\n  if (condition) {\n    return true;\n  } else {\n    return true;\n  }\n}',
        'function test() {\n  return true;\n}'
      );
    });
  });

  describe('Rule 3: prefer-simpler-logic', () => {
    it('should work with no spacing', async () => {
      await testPrettierCompat(
        'const x=!!value;',
        'const x = !!value;'  // Rule doesn't apply in assignment context
      );
    });

    it('should work with normal spacing', async () => {
      await testPrettierCompat(
        'const x = !!value;',
        'const x = !!value;'  // Rule doesn't apply in assignment context
      );
    });

    it('should work with x===true in if', async () => {
      await testPrettierCompat(
        'if(value===true){work();}',
        'if (value) {\n  work();\n}'
      );
    });
  });

  describe('Rule 5: no-redundant-conditionals', () => {
    it('should work with constant conditions', async () => {
      await testPrettierCompat(
        'if(true){doSomething();}',
        'doSomething();'
      );
    });

    it('should work with boolean comparisons', async () => {
      await testPrettierCompat(
        'if(x===true){doWork();}',
        'if (x) {\n  doWork();\n}'
      );
    });

    it('should work with ternaries', async () => {
      await testPrettierCompat(
        'const result=condition?true:false;',
        'const result = Boolean(condition);'
      );
    });
  });

  describe('Idempotency Tests', () => {
    it('should be stable after first fix', async () => {
      await testIdempotency('const x = 1 + 2 + 3;');
    });

    it('should be stable with boolean logic', async () => {
      await testIdempotency('if (!!value) { work(); }');
    });

    it('should be stable with conditionals', async () => {
      await testIdempotency('if (x === true) { doWork(); }');
    });
  });

  describe('Combined Fixes', () => {
    it('should handle multiple rule fixes in same file', async () => {
      await testPrettierCompat(
        'const x=1+2;if(condition===true){work();}if(flag===false){stop();}',
        'const x = 3;\nif (condition) {\n  work();\n}\nif (!flag) {\n  stop();\n}'
      );
    });

    it('should handle nested fixes', async () => {
      await testPrettierCompat(
        'function test(){if(x===true){return 1+2+3;}}',
        'function test() {\n  if (x) {\n    return 6;\n  }\n}'
      );
    });
  });
});
