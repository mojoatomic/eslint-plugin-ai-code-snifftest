/* eslint-env mocha */
"use strict";
const fs = require('fs');
const path = require('path');
const os = require('os');
const RuleTester = require('eslint').RuleTester;
const rule = require('../../lib/rules/no-redundant-calculations');

function writeConfig(dir, cfg) {
  const file = path.join(dir, '.ai-coding-guide.json');
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2), 'utf8');
}

function tempProject(cfg) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nrc-pre-'));
  writeConfig(dir, cfg);
  const srcDir = path.join(dir, 'src');
  fs.mkdirSync(srcDir);
  return { dir, filename: path.join(srcDir, 'a.js') };
}

const tester = new RuleTester({ languageOptions: { ecmaVersion: 2021, sourceType: 'module' } });

tester.run('no-redundant-calculations (precedence)', rule, {
  valid: [
    // domainPriority prefers geometry for 360
    (() => {
      const t = tempProject({
        constants: { geometry: [360], astronomy: [365.25] },
        domainPriority: ['geometry','astronomy']
      });
      return { code: 'const deg = 720/2;', filename: t.filename };
    })(),
    // explicit constantResolution wins regardless of priority
    (() => {
      const t = tempProject({
        constants: { geometry: [360], astronomy: [365.25] },
        domainPriority: ['astronomy','geometry'],
        constantResolution: { '360': 'astronomy' }
      });
      return { code: 'const deg = 720/2;', filename: t.filename };
    })(),
  ],
  invalid: [
    // ambiguous when value appears in two domains and no resolution present
    (() => {
      const t = tempProject({
        constants: { geometry: [360], astronomy: [360] },
        domainPriority: []
      });
return {
        code: 'const x = 720/2;',
        filename: t.filename,
        errors: [{ messageId: 'ambiguousConstant' }]
      };
    })(),
  ]
});