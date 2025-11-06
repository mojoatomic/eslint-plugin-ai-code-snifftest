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
  it('includes architecture in config by default (new default behavior)', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-arch-enabled-'));
    runCliInit(tmp);
    
    const cfgPath = path.join(tmp, '.ai-coding-guide.json');
    assert.ok(fs.existsSync(cfgPath), 'Config file should exist');
    
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    assert.ok(cfg.architecture, 'Should have architecture section by default');
    assert.ok(cfg.architecture.maxFileLength, 'Should have maxFileLength in architecture');
  });

  it('generates ESLint config with architecture guardrails by default', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-arch-eslint-enabled-'));
    runCliInit(tmp);
    
    const eslintPath = path.join(tmp, 'eslint.config.js');
    assert.ok(fs.existsSync(eslintPath), 'ESLint config should exist');
    
    const eslintContent = fs.readFileSync(eslintPath, 'utf8');
    assert.ok(eslintContent.includes('Architecture guardrails'), 'Should have architecture guardrails comment');
    assert.ok(eslintContent.includes("'max-lines'"), 'Should have max-lines rule');
  });

  it('generates AGENTS.md with architecture section by default', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-arch-agents-enabled-'));
    runCliInit(tmp, ['--agents']);
    
    const agentsPath = path.join(tmp, 'AGENTS.md');
    assert.ok(fs.existsSync(agentsPath), 'AGENTS.md should exist');
    const content = fs.readFileSync(agentsPath, 'utf8');
    assert.ok(content.includes('Architecture Guidelines'), 'Should have architecture section');
  });

  it('does not include architecture when --no-arch flag is used', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-no-arch-'));
    runCliInit(tmp, ['--no-arch']);
    
    const cfgPath = path.join(tmp, '.ai-coding-guide.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    assert.strictEqual(cfg.architecture, undefined, 'Should not have architecture with --no-arch');
    
    const eslintPath = path.join(tmp, 'eslint.config.js');
    const eslintContent = fs.readFileSync(eslintPath, 'utf8');
    assert.ok(!eslintContent.includes('Architecture guardrails'), 'Should not have architecture guardrails with --no-arch');
    assert.ok(!eslintContent.includes("'max-lines'"), 'Should not have max-lines rule with --no-arch');
  });
});

// Note: Architecture guardrails are now enabled by default.
// Use --no-arch flag to disable them.
