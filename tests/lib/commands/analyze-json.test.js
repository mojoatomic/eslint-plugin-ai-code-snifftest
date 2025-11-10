/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { analyzeCommand } = require('../../../lib/commands/analyze');

function mkTmp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'exloc-'));
  return dir;
}

describe('analyze JSON includes line metrics', function () {
  it('emits lines + meta.lineCountMode, executable < physical when comments present', function () {
    const cwd = mkTmp();
    // create a sample file with comments and code
    const fileRel = 'src/a.js';
    const fileAbs = path.join(cwd, fileRel);
    fs.mkdirSync(path.dirname(fileAbs), { recursive: true });
    fs.writeFileSync(fileAbs, '/** doc */\n// lead\nconst x = 1;\n\n/* block */\nfunction f(){\n  return x;\n}\n');

    // minimal ESLint JSON for this file
    const lint = [ { filePath: fileRel, messages: [] } ];
    const lintPath = path.join(cwd, 'lint.json');
    fs.writeFileSync(lintPath, JSON.stringify(lint));

    // run analyze
    const outPath = 'analysis.json';
    analyzeCommand(cwd, { _: ['analyze', 'lint.json'], format: 'json', output: outPath });

    const out = JSON.parse(fs.readFileSync(path.join(cwd, outPath), 'utf8'));
    assert.ok(out.lines, 'lines present');
    assert.ok(out.meta && out.meta.lineCountMode === 'executable', 'meta.lineCountMode=executable');
    assert.ok(out.lines.physical > 0, 'physical > 0');
    assert.ok(out.lines.executable >= 0, 'executable >= 0');
    assert.ok(out.lines.physical > out.lines.executable, 'executable < physical when comments present');
  });
});
