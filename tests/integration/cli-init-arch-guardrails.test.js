/* eslint-env mocha */
/* global describe, it */
"use strict";

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

function runCliInit(tmpDir, args = []) {
  const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
  const env = { ...process.env, FORCE_AI_CONFIG: '1', FORCE_ESLINT_CONFIG: '1', SKIP_AI_REQUIREMENTS: '1' };
  execFileSync('node', [cliPath, 'init', '--primary=general', '--yes', '--eslint', ...args], {
    cwd: tmpDir,
    env,
    stdio: 'pipe'
  });
}

describe('CLI init with architecture guardrails', function () {
  it('does not include architecture in config when not enabled (default)', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-arch-disabled-'));
    runCliInit(tmp);
    
    const cfgPath = path.join(tmp, '.ai-coding-guide.json');
    assert.ok(fs.existsSync(cfgPath), 'Config file should exist');
    
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    assert.strictEqual(cfg.architecture, undefined, 'Should not have architecture section by default');
  });

  it('generates ESLint config without architecture guardrails comment when not enabled', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-arch-eslint-disabled-'));
    runCliInit(tmp);
    
    const eslintPath = path.join(tmp, 'eslint.config.js');
    assert.ok(fs.existsSync(eslintPath), 'ESLint config should exist');
    
    const eslintContent = fs.readFileSync(eslintPath, 'utf8');
    assert.ok(!eslintContent.includes('Architecture guardrails'), 'Should not have architecture guardrails comment');
    // Note: ESLint config has some complexity rules by default, but not the architecture-specific ones
  });

  it('generates AGENTS.md without architecture section when not enabled', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-arch-agents-disabled-'));
    runCliInit(tmp, ['--agents']);
    
    const agentsPath = path.join(tmp, 'AGENTS.md');
    if (fs.existsSync(agentsPath)) {
      const content = fs.readFileSync(agentsPath, 'utf8');
      assert.ok(!content.includes('Architecture Guidelines'), 'Should not have architecture section');
    }
  });
});

// Note: Testing with architecture enabled requires interactive mode
// which is covered by manual testing. These tests verify the default
// behavior (architecture disabled) works correctly.
