/* eslint-env mocha */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const RuleTester = require('eslint').RuleTester;
const rule = require('../../lib/rules/no-redundant-calculations');

function tempConfigWithResolution(map) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nrc-'));
  const file = path.join(dir, '.ai-coding-guide.json');
  const cfg = { constantResolution: map };
  fs.writeFileSync(file, JSON.stringify(cfg), 'utf8');
  const srcDir = path.join(dir, 'src');
  fs.mkdirSync(srcDir);
  return { dir, filename: path.join(srcDir, 'a.js') };
}

const tester = new RuleTester({ languageOptions: { ecmaVersion: 2021, sourceType: 'module' } });

tester.run('no-redundant-calculations (integration: domain resolution)', rule, {
  valid: [
    // File-level @domains geometry should allow 720/2 (=360)
    {
      code: '// @domains geometry\nconst deg = 720 / 2;',
    },
    // Name-based: includes geometry term
    {
      code: 'const circleAngle = 720 / 2;',
    },
    // constantResolution mapping 360->geometry
    (() => {
      const t = tempConfigWithResolution({ '360': 'geometry' });
      return {
        code: 'const z = 720 / 2;',
        filename: t.filename
      };
    })(),
  ],
  invalid: []
});