/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

describe('CLI learn → init workflow', function () {
  it('preserves forbiddenNames through learn → init', function () {
    // Create temp directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-init-'));
    
    const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
    const env = { ...process.env, SKIP_AI_REQUIREMENTS: '1', FORCE_AI_CONFIG: '1' };
    const cfgPath = path.join(tempDir, '.ai-coding-guide.json');
    
    // Step 1: Simulate what learn command would create
    // Create a config file with forbidden names (as if learn had saved them)
    const configWithForbiddenNames = {
      domains: { primary: 'general', additional: [] },
      domainPriority: ['general'],
      constants: {},
      terms: { entities: [], properties: [], actions: [] },
      naming: {
        style: 'camelCase',
        booleanPrefix: ['is', 'has', 'should', 'can'],
        asyncPrefix: ['fetch', 'load', 'save'],
        pluralizeCollections: true
      },
      antiPatterns: {
        forbiddenNames: ['data', 'result', 'temp', 'value', 'item'],
        forbiddenTerms: []
      },
      minimumMatch: 0.6,
      minimumConfidence: 0.7
    };
    
    fs.writeFileSync(cfgPath, JSON.stringify(configWithForbiddenNames, null, 2));
    
    const cfgAfterLearn = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    const forbiddenNamesFromLearn = cfgAfterLearn.antiPatterns?.forbiddenNames || [];
    
    // Verify we have forbidden names to test with
    assert.ok(forbiddenNamesFromLearn.length > 0, 
      'Config should have forbidden names for testing');
    
    // Step 2: Run init (should merge with existing config, not overwrite)
    execFileSync('node', [cliPath, 'init', '--primary=dev-tools', '--additional=cli'], {
      cwd: tempDir,
      env,
      stdio: 'pipe'
    });
    
    // Step 3: Verify init preserved forbidden names from learn
    const cfgAfterInit = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    const forbiddenNamesAfterInit = cfgAfterInit.antiPatterns?.forbiddenNames || [];
    
    // Assert: forbidden names should be preserved
    assert.deepStrictEqual(
      forbiddenNamesAfterInit.sort(),
      forbiddenNamesFromLearn.sort(),
      'Init should preserve forbiddenNames from learn command'
    );
    
    // Also verify init added its domain settings
    assert.strictEqual(cfgAfterInit.domains.primary, 'dev-tools',
      'Init should set primary domain');
    assert.ok(cfgAfterInit.domains.additional.includes('cli'),
      'Init should add additional domains');
    
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
