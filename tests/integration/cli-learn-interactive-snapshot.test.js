/* eslint-env mocha */
/* global describe, it */
"use strict";

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function writeFile(dir, rel, content) {
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

function runInteractiveLearn(tmpDir, inputs) {
  return new Promise((resolve, reject) => {
    const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
    const env = { ...process.env, SKIP_AI_REQUIREMENTS: '1' };
    const proc = spawn('node', [cliPath, 'learn', '--interactive', '--sample=50', '--no-cache'], {
      cwd: tmpDir,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let inputIdx = 0;

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      // Auto-respond to prompts
      if (inputIdx < inputs.length) {
        proc.stdin.write(inputs[inputIdx] + '\n');
        inputIdx++;
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    proc.on('error', reject);

    // Timeout fallback
    setTimeout(() => {
      proc.kill();
      reject(new Error('Process timeout'));
    }, 10000);
  });
}

describe('CLI learn --interactive (snapshot)', function () {
  this.timeout(15000);

  it('happy path: rename constant and map to domain', async function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-learn-interactive-'));
    
    // Setup test files with recognizable constants
    writeFile(tmp, 'src/astronomy.js', `
      const isActive = true;
      const hasData = false;
      const tropicalYear = 365.25;
      const lunarMonth = 29.53059;
      const circleAngle = 360;
    `);

    // Interactive inputs:
    // 1. Naming style question -> Y (accept)
    // 2. Boolean prefixes edit -> just Enter (keep defaults)
    // 3. Generic names -> Y (accept forbiddenNames)
    // 4. Constant [1] 365.25 -> r (rename)
    // 5. New name -> TROPICAL_YEAR_DAYS
    // 6. Constant [2] 29.53059 -> m (map)
    // 7. Domain -> astronomy
    // 8. Add to fingerprint -> Y
    // 9. Constant [3] 360 -> s (skip)
    // 10. Generate fingerprint -> Y
    // 11. Apply config -> Y
    const inputs = [
      'y',                           // Accept naming style
      '',                            // Keep boolean prefixes
      'y',                           // Accept generic names
      'r',                           // Rename first constant
      'TROPICAL_YEAR_DAYS',          // New name
      'm',                           // Map second constant
      'astronomy',                   // Domain mapping
      'y',                           // Add to fingerprint
      's',                           // Skip third constant
      'y',                           // Generate fingerprint
      'y'                            // Apply changes
    ];

    const result = await runInteractiveLearn(tmp, inputs);
    
    // Verify exit code
    assert.strictEqual(result.code, 0, 'Process should exit successfully');

    // Verify config was updated
    const cfgPath = path.join(tmp, '.ai-coding-guide.json');
    assert.ok(fs.existsSync(cfgPath), 'Config file should exist');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    
    // Verify naming was updated
    assert.ok(cfg.naming, 'Config should have naming section');
    assert.ok(cfg.naming.style, 'Naming style should be set');

    // Verify constantResolution has mapping
    assert.ok(cfg.constantResolution, 'Config should have constantResolution');
    assert.strictEqual(cfg.constantResolution['29.53059'], 'astronomy', 'Constant should be mapped to astronomy domain');

    // Verify fingerprint was generated
    const fpPath = path.join(tmp, '.ai-constants', 'project-fingerprint.js');
    assert.ok(fs.existsSync(fpPath), 'Fingerprint file should exist');
    const fpContent = fs.readFileSync(fpPath, 'utf8');
    assert.ok(fpContent.includes('TROPICAL_YEAR_DAYS'), 'Fingerprint should include renamed constant');
    assert.ok(fpContent.includes('365.25'), 'Fingerprint should include constant value');

    // Verify output contains expected prompts
    assert.ok(result.stdout.includes('Naming'), 'Output should show naming prompts');
    assert.ok(result.stdout.includes('Domain-aware constants'), 'Output should show constants section');
  });

  it('back navigation: go back and change decision', async function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-learn-back-'));
    
    writeFile(tmp, 'src/test.js', `
      const isReady = true;
      const value1 = 365.25;
      const value2 = 60;
    `);

    // Interactive inputs:
    // 1. Accept naming -> Y
    // 2. Boolean prefixes -> Enter
    // 3. Generic names -> n
    // 4. Constant [1] -> s (skip)
    // 5. Constant [2] -> b (back)
    // 6. Constant [1] again -> a (add)
    // 7. Constant [2] again -> s (skip)
    // 8. Generate fingerprint -> Y
    // 9. Apply config -> Y
    const inputs = [
      'y',      // Accept naming
      '',       // Keep prefixes
      'n',      // Skip generic names
      's',      // Skip first constant
      'b',      // Go back
      'a',      // Add first constant (after going back)
      's',      // Skip second constant
      'y',      // Generate fingerprint
      'y'       // Apply changes
    ];

    const result = await runInteractiveLearn(tmp, inputs);
    
    assert.strictEqual(result.code, 0, 'Process should exit successfully');

    // Verify fingerprint contains the constant we went back to add
    const fpPath = path.join(tmp, '.ai-constants', 'project-fingerprint.js');
    assert.ok(fs.existsSync(fpPath), 'Fingerprint file should exist');
    const fpContent = fs.readFileSync(fpPath, 'utf8');
    assert.ok(fpContent.includes('365.25'), 'Fingerprint should include constant after back navigation');
  });

  it('skip-all: skip remaining constants', async function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-learn-skipall-'));
    
    writeFile(tmp, 'src/constants.js', `
      const isTest = true;
      const val1 = 365.25;
      const val2 = 60;
      const val3 = 1000;
      const val4 = 86400;
    `);

    // Interactive inputs:
    // 1. Accept naming -> Y
    // 2. Boolean prefixes -> Enter
    // 3. Generic names -> Y
    // 4. Constant [1] -> a (add)
    // 5. Constant [2] -> A (skip-all)
    // 6. Generate fingerprint -> Y
    // 7. Apply config -> Y
    const inputs = [
      'y',      // Accept naming
      '',       // Keep prefixes
      'y',      // Accept generic names
      'a',      // Add first constant
      'A',      // Skip all remaining
      'y',      // Generate fingerprint
      'y'       // Apply changes
    ];

    const result = await runInteractiveLearn(tmp, inputs);
    
    assert.strictEqual(result.code, 0, 'Process should exit successfully');

    // Verify only first constant is in fingerprint
    const fpPath = path.join(tmp, '.ai-constants', 'project-fingerprint.js');
    assert.ok(fs.existsSync(fpPath), 'Fingerprint file should exist');
    const fpContent = fs.readFileSync(fpPath, 'utf8');
    assert.ok(fpContent.includes('365.25'), 'Fingerprint should include first constant');
    // Should not process remaining constants after skip-all
    const matches = (fpContent.match(/value:/g) || []).length;
    assert.strictEqual(matches, 1, 'Should only have one constant after skip-all');
  });
});
