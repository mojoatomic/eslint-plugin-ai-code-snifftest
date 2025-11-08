/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const { DEFAULT_ARCHITECTURE, mergeArchitecture } = require('../../../lib/utils/arch-defaults');

describe('arch-defaults', function () {
  describe('DEFAULT_ARCHITECTURE', function () {
    it('has all required sections', function () {
      assert.ok(DEFAULT_ARCHITECTURE.fileStructure);
      assert.ok(DEFAULT_ARCHITECTURE.maxFileLength);
      assert.ok(DEFAULT_ARCHITECTURE.organization);
      assert.ok(DEFAULT_ARCHITECTURE.functions);
      assert.ok(DEFAULT_ARCHITECTURE.patterns);
    });

    it('has reasonable default values', function () {
      assert.strictEqual(DEFAULT_ARCHITECTURE.fileStructure.pattern, 'feature-based');
      assert.strictEqual(DEFAULT_ARCHITECTURE.maxFileLength.cli, 100);
      assert.strictEqual(DEFAULT_ARCHITECTURE.maxFileLength.default, 250);
      assert.strictEqual(DEFAULT_ARCHITECTURE.functions.maxLength, 50);
      assert.strictEqual(DEFAULT_ARCHITECTURE.functions.maxComplexity, 10);
      assert.strictEqual(DEFAULT_ARCHITECTURE.patterns.cliStyle, 'orchestration-shell');
    });

    it('is frozen (immutable)', function () {
      assert.throws(() => {
        DEFAULT_ARCHITECTURE.fileStructure.pattern = 'layer-based';
      }, TypeError);
    });
  });

  describe('mergeArchitecture', function () {
    it('returns defaults when no user config provided', function () {
      const merged = mergeArchitecture();
      assert.deepStrictEqual(merged, JSON.parse(JSON.stringify(DEFAULT_ARCHITECTURE)));
    });

    it('returns defaults when null/undefined passed', function () {
      const merged1 = mergeArchitecture(null);
      const merged2 = mergeArchitecture(undefined);
      assert.deepStrictEqual(merged1, JSON.parse(JSON.stringify(DEFAULT_ARCHITECTURE)));
      assert.deepStrictEqual(merged2, JSON.parse(JSON.stringify(DEFAULT_ARCHITECTURE)));
    });

    it('merges user fileStructure', function () {
      const user = {
        fileStructure: {
          pattern: 'domain-driven'
        }
      };
      const merged = mergeArchitecture(user);
      assert.strictEqual(merged.fileStructure.pattern, 'domain-driven');
      // Other defaults should remain
      assert.strictEqual(merged.maxFileLength.cli, 100);
    });

    it('merges user maxFileLength', function () {
      const user = {
        maxFileLength: {
          cli: 150,
          custom: 400
        }
      };
      const merged = mergeArchitecture(user);
      assert.strictEqual(merged.maxFileLength.cli, 150);
      assert.strictEqual(merged.maxFileLength.custom, 400);
      // Other defaults should remain
      assert.strictEqual(merged.maxFileLength.command, 150);
    });

    it('merges user functions limits', function () {
      const user = {
        functions: {
          maxLength: 100,
          maxComplexity: 15
        }
      };
      const merged = mergeArchitecture(user);
      assert.strictEqual(merged.functions.maxLength, 100);
      assert.strictEqual(merged.functions.maxComplexity, 15);
      // Other defaults should remain
      assert.strictEqual(merged.functions.maxDepth, 4);
    });

    it('merges user patterns', function () {
      const user = {
        patterns: {
          asyncStyle: 'promises'
        }
      };
      const merged = mergeArchitecture(user);
      assert.strictEqual(merged.patterns.asyncStyle, 'promises');
      // Other defaults should remain
      assert.strictEqual(merged.patterns.cliStyle, 'orchestration-shell');
    });

    it('merges multiple sections at once', function () {
      const user = {
        fileStructure: { pattern: 'layer-based' },
        maxFileLength: { cli: 80 },
        functions: { maxComplexity: 8 }
      };
      const merged = mergeArchitecture(user);
      assert.strictEqual(merged.fileStructure.pattern, 'layer-based');
      assert.strictEqual(merged.maxFileLength.cli, 80);
      assert.strictEqual(merged.functions.maxComplexity, 8);
    });

    it('does not mutate the default', function () {
      const user = { maxFileLength: { cli: 999 } };
      mergeArchitecture(user);
      // DEFAULT_ARCHITECTURE should remain unchanged
      assert.strictEqual(DEFAULT_ARCHITECTURE.maxFileLength.cli, 100);
    });
  });
});
