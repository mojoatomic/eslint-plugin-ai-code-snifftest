/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const {
  removeComments,
  removeBlankLines,
  countExecutableLines
} = require('../../../lib/metrics/line-counter');

describe('metrics/line-counter', function () {
  describe('removeComments', function () {
    it('removes single-line and multi-line comments', function () {
      const code = 'const x = 1; // inline\n/* block */\nconst y = 2;';
      const out = removeComments(code);
      assert.ok(!out.includes('inline'));
      assert.ok(!out.includes('block'));
      assert.ok(out.includes('const x = 1;'));
      assert.ok(out.includes('const y = 2;'));
    });

    it('removes JSDoc comments', function () {
      const code = '/**\n * Sum two numbers\n */\nfunction add(a, b) {\n  return a + b;\n}';
      const out = removeComments(code);
      assert.ok(!out.includes('Sum two numbers'));
      assert.ok(out.includes('function add'));
    });
  });

  describe('removeBlankLines', function () {
    it('removes blank and whitespace-only lines', function () {
      const code = 'a\n\n  \n b';
      const out = removeBlankLines(code);
      assert.strictEqual(out, 'a\n b');
    });
  });

  describe('countExecutableLines', function () {
    it('counts only code lines', function () {
      const code = 'function f() {\n  // c1\n  const x = 1;\n  /* c2 */\n  return x;\n}';
      const n = countExecutableLines(code);
      // function line, const, return, closing brace
      assert.strictEqual(n, 4);
    });

    it('treats documented and undocumented code equally', function () {
      const documented = '/** doc */\nfunction v(d) {\n  // Check\n  if (!d) throw new Error(\'x\');\n  return d;\n}';
      const plain = 'function v(d) {\n  if (!d) throw new Error(\'x\');\n  return d;\n}';
      assert.strictEqual(countExecutableLines(documented), countExecutableLines(plain));
    });
  });
});
