/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const { generateArchitectureRules, generateArchitectureESLintConfig } = require('../../../lib/generators/eslint-arch-config');

describe('eslint-arch-config generator', function () {
  describe('generateArchitectureRules', function () {
    it('generates default rules when no config provided', function () {
      const rulesConfig = generateArchitectureRules();
      assert.ok(rulesConfig.rules);
      assert.ok(rulesConfig.overrides);
      assert.ok(Array.isArray(rulesConfig.overrides));
    });

    it('includes all base architecture rules', function () {
      const rulesConfig = generateArchitectureRules();
      const { rules } = rulesConfig;
      
      assert.ok(rules['max-lines']);
      assert.ok(rules['max-lines-per-function']);
      assert.ok(rules['max-depth']);
      assert.ok(rules['complexity']);
      assert.ok(rules['max-params']);
      assert.ok(rules['max-statements']);
    });

    it('uses default values correctly', function () {
      const rulesConfig = generateArchitectureRules();
      const { rules } = rulesConfig;
      
      assert.deepStrictEqual(rules['max-lines'], ['warn', { max: 250, skipBlankLines: true, skipComments: true }]);
      assert.deepStrictEqual(rules['max-lines-per-function'], ['warn', { max: 50, skipBlankLines: true, skipComments: true }]);
      assert.deepStrictEqual(rules['max-depth'], ['warn', 4]);
      assert.deepStrictEqual(rules['complexity'], ['warn', 10]);
      assert.deepStrictEqual(rules['max-params'], ['warn', 4]);
      assert.deepStrictEqual(rules['max-statements'], ['warn', 30]);
    });

    it('applies custom function limits', function () {
      const arch = {
        functions: {
          maxLength: 100,
          maxComplexity: 15,
          maxDepth: 5,
          maxParams: 6,
          maxStatements: 40
        }
      };
      const rulesConfig = generateArchitectureRules(arch);
      const { rules } = rulesConfig;
      
      assert.deepStrictEqual(rules['max-lines-per-function'], ['warn', { max: 100, skipBlankLines: true, skipComments: true }]);
      assert.deepStrictEqual(rules['complexity'], ['warn', 15]);
      assert.deepStrictEqual(rules['max-depth'], ['warn', 5]);
      assert.deepStrictEqual(rules['max-params'], ['warn', 6]);
      assert.deepStrictEqual(rules['max-statements'], ['warn', 40]);
    });

    it('applies custom file length limits', function () {
      const arch = {
        maxFileLength: {
          default: 300,
          cli: 50
        }
      };
      const rulesConfig = generateArchitectureRules(arch);
      const { rules } = rulesConfig;
      
      assert.deepStrictEqual(rules['max-lines'], ['warn', { max: 300, skipBlankLines: true, skipComments: true }]);
    });

    it('generates CLI file overrides', function () {
      const rulesConfig = generateArchitectureRules();
      const cliOverride = rulesConfig.overrides.find(o => o.files.includes('**/bin/*.js'));
      
      assert.ok(cliOverride, 'Should have CLI override');
      assert.ok(cliOverride.rules['max-lines']);
      assert.strictEqual(cliOverride.rules['max-lines'][0], 'warn'); // CLI is warn in passive start
      assert.strictEqual(cliOverride.rules['max-lines'][1].max, 100);
    });

    it('generates command file overrides', function () {
      const rulesConfig = generateArchitectureRules();
      const cmdOverride = rulesConfig.overrides.find(o => o.files.includes('**/commands/**/*.js'));
      
      assert.ok(cmdOverride, 'Should have command override');
      assert.strictEqual(cmdOverride.rules['max-lines'][1].max, 150);
    });

    it('generates util file overrides', function () {
      const rulesConfig = generateArchitectureRules();
      const utilOverride = rulesConfig.overrides.find(o => o.files.includes('**/utils/**/*.js'));
      
      assert.ok(utilOverride, 'Should have util override');
      assert.strictEqual(utilOverride.rules['max-lines'][1].max, 200);
    });

    it('generates generator file overrides', function () {
      const rulesConfig = generateArchitectureRules();
      const genOverride = rulesConfig.overrides.find(o => o.files.includes('**/generators/**/*.js'));
      
      assert.ok(genOverride, 'Should have generator override');
      assert.strictEqual(genOverride.rules['max-lines'][1].max, 250);
    });

    it('generates component file overrides', function () {
      const rulesConfig = generateArchitectureRules();
      const compOverride = rulesConfig.overrides.find(o => o.files.some(f => f.includes('**/components/**')));
      
      assert.ok(compOverride, 'Should have component override');
      assert.strictEqual(compOverride.rules['max-lines'][1].max, 300);
    });

    it('generates test file overrides with lenient rules', function () {
      const rulesConfig = generateArchitectureRules();
      const testOverride = rulesConfig.overrides.find(o => o.files.includes('**/*.test.js'));
      
      assert.ok(testOverride, 'Should have test override');
      assert.strictEqual(testOverride.rules['max-lines-per-function'], 'off');
      assert.strictEqual(testOverride.rules['max-statements'], 'off');
      assert.strictEqual(testOverride.rules['complexity'], 'off');
      assert.strictEqual(testOverride.rules['max-depth'], 'off');
    });
  });

  describe('generateArchitectureESLintConfig', function () {
    it('generates valid JavaScript config string', function () {
      const config = generateArchitectureESLintConfig();
      assert.ok(typeof config === 'string');
      assert.ok(config.includes('rules:'));
      assert.ok(config.includes('overrides:'));
    });

    it('includes comment header', function () {
      const config = generateArchitectureESLintConfig();
      assert.ok(config.includes('// Architecture guardrails (generated)'));
    });

    it('formats rules correctly', function () {
      const config = generateArchitectureESLintConfig();
      assert.ok(config.includes("'max-lines':"));
      assert.ok(config.includes("'max-lines-per-function':"));
      assert.ok(config.includes("'complexity':"));
    });

    it('formats overrides correctly', function () {
      const config = generateArchitectureESLintConfig();
      assert.ok(config.includes('files:'));
      assert.ok(config.includes('**/bin/*.js'));
      assert.ok(config.includes('**/*.test.js'));
    });

    it('produces parseable config structure', function () {
      const config = generateArchitectureESLintConfig();
      // Should be valid JavaScript object (would throw if malformed)
      assert.doesNotThrow(() => {
         
        const evaluatedConfig = eval(config);
        assert.ok(evaluatedConfig.rules);
        assert.ok(evaluatedConfig.overrides);
      });
    });
  });
});
