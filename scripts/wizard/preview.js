/*
 Minimal wizard preview: compose a flat ESLint config from presets and plugin rules
 Usage: node scripts/wizard/preview.js --framework react --typescript --dry-run
*/
'use strict';

const path = require('path');
const fs = require('fs');
const baseline = require('../../lib/eslint-presets/baseline');
const aiFriendly = require('../../lib/eslint-presets/ai-friendly');
const reactPreset = require('../../lib/eslint-presets/react');

function parseArgs(argv) {
  const flags = new Set();
  const opts = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--typescript' || a === '--dry-run') flags.add(a);
    else if (a === '--framework') { opts.framework = argv[++i] || 'react'; }
  }
  return { framework: opts.framework || 'react', typescript: flags.has('--typescript'), dry: flags.has('--dry-run') };
}

function generateConfig(framework, typescript) {
  const lines = [];
  lines.push('import js from "@eslint/js";');
  if (framework === 'react') {
    lines.push('import reactPlugin from "eslint-plugin-react";');
    lines.push('import reactHooks from "eslint-plugin-react-hooks";');
  }
  if (typescript) {
    lines.push('import tsParser from "@typescript-eslint/parser";');
    lines.push('import tsPlugin from "@typescript-eslint/eslint-plugin";');
  }
  lines.push('import aiPlugin from "eslint-plugin-ai-code-snifftest";');
  lines.push('');
  lines.push('export default [');
  lines.push('  js.configs.recommended,');
  if (typescript) {
    lines.push('  { files: ["**/*.{ts,tsx}"], languageOptions: { parser: tsParser }, plugins: { "@typescript-eslint": tsPlugin } },');
  }
  const mergedRules = Object.assign({}, baseline.rules, aiFriendly.rules);
  if (framework === 'react') Object.assign(mergedRules, reactPreset.rules);
  // Domain rules placeholder
  mergedRules['ai-code-snifftest/no-redundant-calculations'] = ['warn', {}];
  mergedRules['ai-code-snifftest/no-equivalent-branches'] = 'warn';
  mergedRules['ai-code-snifftest/prefer-simpler-logic'] = 'warn';
  lines.push('  {');
  lines.push('    plugins: { "ai-code-snifftest": aiPlugin },');
  lines.push('    rules: ' + JSON.stringify(mergedRules, null, 2));
  lines.push('  }');
  lines.push('];');
  return lines.join('\n');
}

(function main(){
  const { framework, typescript, dry } = parseArgs(process.argv);
  const content = generateConfig(framework, typescript);
  if (dry) {
    console.log('--- eslint.config.preview.js ---\n');
    console.log(content);
    console.log('\nDependencies to install:');
    const deps = ['eslint','@eslint/js','eslint-plugin-ai-code-snifftest'];
    if (framework === 'react') deps.push('eslint-plugin-react','eslint-plugin-react-hooks');
    if (typescript) deps.push('@typescript-eslint/parser','@typescript-eslint/eslint-plugin');
    console.log('  ' + deps.join(' '));
  } else {
    const out = path.resolve(process.cwd(), 'eslint.config.preview.js');
    fs.writeFileSync(out, content, 'utf8');
    console.log('Wrote preview config to', out);
  }
})();