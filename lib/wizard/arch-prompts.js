'use strict';

const path = require('path');

/**
 * Prompt user for architecture guardrails configuration
 * @param {readline.Interface} rl - Readline interface
 * @param {Function} ask - Question helper function
 * @returns {Promise<object|null>} Architecture config or null if disabled
 */
async function promptArchitectureGuardrails(rl, ask) {
  console.log('\n--- Architecture Guardrails ---');
  console.log('Enable code quality guardrails (file length, function complexity limits)?');
  
  const enableArch = (await ask(rl, 'Enable architectural guardrails? (Y/n): ')).trim().toLowerCase();
  
  if (enableArch && enableArch.startsWith('n')) {
    console.log('✗ Architecture guardrails disabled');
    return null;
  }

  // Load defaults
  const { DEFAULT_ARCHITECTURE } = require(path.join(__dirname, '..', 'utils', 'arch-defaults'));
  const architecture = JSON.parse(JSON.stringify(DEFAULT_ARCHITECTURE));
  
  const customizeArch = (await ask(rl, 'Customize thresholds (file/function limits)? (y/N): ')).trim().toLowerCase();
  
  if (customizeArch && customizeArch.startsWith('y')) {
    console.log('\nCurrent defaults:');
    console.log(`  - File length (CLI): ${architecture.maxFileLength.cli} lines`);
    console.log(`  - File length (default): ${architecture.maxFileLength.default} lines`);
    console.log(`  - Function length: ${architecture.functions.maxLength} lines`);
    console.log(`  - Function complexity: ${architecture.functions.maxComplexity}`);
    
    const cliMax = (await ask(rl, `CLI file max lines [${architecture.maxFileLength.cli}]: `)).trim();
    if (cliMax) architecture.maxFileLength.cli = parseInt(cliMax, 10);
    
    const defaultMax = (await ask(rl, `Default file max lines [${architecture.maxFileLength.default}]: `)).trim();
    if (defaultMax) architecture.maxFileLength.default = parseInt(defaultMax, 10);
    
    const funcMax = (await ask(rl, `Function max lines [${architecture.functions.maxLength}]: `)).trim();
    if (funcMax) architecture.functions.maxLength = parseInt(funcMax, 10);
    
    const complexMax = (await ask(rl, `Function max complexity [${architecture.functions.maxComplexity}]: `)).trim();
    if (complexMax) architecture.functions.maxComplexity = parseInt(complexMax, 10);
  }
  
  console.log('✓ Architecture guardrails enabled');
  return architecture;
}

module.exports = {
  promptArchitectureGuardrails
};
