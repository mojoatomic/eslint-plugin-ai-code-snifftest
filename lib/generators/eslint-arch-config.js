'use strict';

const { mergeArchitecture } = require('../utils/arch-defaults');

/**
 * Generate ESLint architecture rules from config
 * @param {object} architecture - Architecture configuration
 * @returns {object} ESLint rules configuration with overrides
 */
function generateArchitectureRules(architecture) {
  const arch = mergeArchitecture(architecture);
  const functions = arch.functions || {};
  const maxFileLength = arch.maxFileLength || {};

  // Base architecture rules (applied globally unless overridden)
  const baseRules = {
    'max-lines': ['warn', { max: maxFileLength.default || 250, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['warn', { max: functions.maxLength || 50, skipBlankLines: true, skipComments: true }],
    'max-depth': ['warn', functions.maxDepth || 4],
    'complexity': ['warn', functions.maxComplexity || 10],
    'max-params': ['warn', functions.maxParams || 4],
    'max-statements': ['warn', functions.maxStatements || 30]
  };

  // Per-path overrides based on maxFileLength config
  const overrides = [];

  // CLI files - strict limit
  if (maxFileLength.cli) {
    overrides.push({
      files: ['**/bin/*.js', '**/bin/**/*.js'],
      rules: {
        'max-lines': ['error', { max: maxFileLength.cli, skipBlankLines: true, skipComments: true }]
      }
    });
  }

  // Command files
  if (maxFileLength.command) {
    overrides.push({
      files: ['**/commands/**/*.js', '**/lib/commands/**/*.js'],
      rules: {
        'max-lines': ['warn', { max: maxFileLength.command, skipBlankLines: true, skipComments: true }]
      }
    });
  }

  // Util files
  if (maxFileLength.util) {
    overrides.push({
      files: ['**/utils/**/*.js', '**/lib/utils/**/*.js'],
      rules: {
        'max-lines': ['warn', { max: maxFileLength.util, skipBlankLines: true, skipComments: true }]
      }
    });
  }

  // Generator files
  if (maxFileLength.generator) {
    overrides.push({
      files: ['**/generators/**/*.js', '**/lib/generators/**/*.js'],
      rules: {
        'max-lines': ['warn', { max: maxFileLength.generator, skipBlankLines: true, skipComments: true }]
      }
    });
  }

  // Component files (for frameworks)
  if (maxFileLength.component) {
    overrides.push({
      files: ['**/components/**/*.js', '**/components/**/*.jsx', '**/components/**/*.tsx'],
      rules: {
        'max-lines': ['warn', { max: maxFileLength.component, skipBlankLines: true, skipComments: true }]
      }
    });
  }

  // Test files - more lenient
  overrides.push({
    files: ['**/*.test.js', '**/*.spec.js', '**/tests/**/*.js'],
    rules: {
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      'complexity': 'off'
    }
  });

  return {
    rules: baseRules,
    overrides
  };
}

/**
 * Generate complete ESLint config string for architecture rules
 * @param {object} architecture - Architecture configuration
 * @returns {string} ESLint config as JavaScript code
 */
function generateArchitectureESLintConfig(architecture) {
  const { rules, overrides } = generateArchitectureRules(architecture);

  const lines = [
    '// Architecture guardrails (generated)',
    '({',
    '  rules: {',
    ...Object.entries(rules).map(([rule, config]) => {
      const configStr = JSON.stringify(config);
      return `    '${rule}': ${configStr},`;
    }),
    '  },',
    '  overrides: ['
  ];

  for (const override of overrides) {
    lines.push('    {');
    lines.push(`      files: ${JSON.stringify(override.files)},`);
    lines.push('      rules: {');
    for (const [rule, config] of Object.entries(override.rules)) {
      const configStr = typeof config === 'string' ? `'${config}'` : JSON.stringify(config);
      lines.push(`        '${rule}': ${configStr},`);
    }
    lines.push('      }');
    lines.push('    },');
  }

  lines.push('  ]');
  lines.push('})');  

  return lines.join('\n');
}

module.exports = {
  generateArchitectureRules,
  generateArchitectureESLintConfig
};
