/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const eslint = require('eslint');
const { getDomainAnnotation, getFileDomains } = require('../../../lib/utils/domain-annotations');

function parse(code) {
  const linter = new eslint.Linter();
  const messages = [];
  const probeRule = {
    create(context) {
      return {
        Program(node) {
          const ann = getDomainAnnotation(node, context);
          const fileDomains = getFileDomains(context);
          messages.push({ ann, fileDomains });
        }
      };
    }
  };
  linter.verify(code, [{ languageOptions: { ecmaVersion: 2021 }, plugins: { test: { rules: { probe: probeRule } } }, rules: { 'test/probe': 'error' } }]);
  return messages[0];
}

describe('domain-annotations', function () {
  it('detects file-level @domains', function () {
    const res = parse('// @domains astronomy, geometry\nconst x = 1;');
    assert.deepStrictEqual(res.fileDomains, ['astronomy','geometry']);
  });

  it('detects @domain before node', function () {
    const linter = new eslint.Linter();
    let seen = null;
    const probe2 = {
      create(context) {
        return {
          VariableDeclaration(node) {
            seen = getDomainAnnotation(node, context);
          }
        };
      }
    };
    linter.verify('// header\n/* @domain geometry */\nconst y = 360;', [{ languageOptions: { ecmaVersion: 2021 }, plugins: { test: { rules: { probe2 } } }, rules: { 'test/probe2': 'error' } }]);
    assert.strictEqual(seen, 'geometry');
  });

  it('falls back to nearest section-level @domain above node', function () {
    const linter = new eslint.Linter();
    let last = null;
    const probe3 = {
      create(context) {
        return {
          VariableDeclaration(node) {
            last = getDomainAnnotation(node, context);
          }
        };
      }
    };
    const code = '// banner\n// @domain astronomy\nconst a = 1;\n\n// some text\n// @domain geometry\nfunction f(){}\n\nconst b = 2;';
    linter.verify(code, [{ languageOptions: { ecmaVersion: 2021 }, plugins: { test: { rules: { probe3 } } }, rules: { 'test/probe3': 'error' } }]);
    // The last var decl should pick up geometry section
    assert.strictEqual(last, 'geometry');
  });

  it('supports JSDoc @domain on block comment', function () {
    const linter = new eslint.Linter();
    let seen = null;
    const probe4 = {
      create(context) {
        return {
          VariableDeclaration(node) {
            seen = getDomainAnnotation(node, context);
          }
        };
      }
    };
    const code = '/**\n * @domain physics\n */\nconst c = 299792458;';
    linter.verify(code, [{ languageOptions: { ecmaVersion: 2021 }, plugins: { test: { rules: { probe4 } } }, rules: { 'test/probe4': 'error' } }]);
    assert.strictEqual(seen, 'physics');
  });
});
