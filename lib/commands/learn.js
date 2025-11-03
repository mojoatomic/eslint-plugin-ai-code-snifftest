"use strict";

const fs = require('fs');
const path = require('path');

function learnCommand(cwd, args) {
const { extractFindings } = require(path.join(__dirname, '..', 'scanner', 'extract'));
  const { reconcile } = require(path.join(__dirname, '..', 'scanner', 'reconcile'));
  const mode = args.strict ? 'strict' : (args.permissive ? 'permissive' : 'adaptive');
  const sanityRules = {
    naming: { style: 'camelCase', booleanPrefix: ['is','has','should','can'], constants: 'UPPER_SNAKE_CASE' },
    minimumConfidence: mode === 'strict' ? 0.9 : 0.7,
    minimumMatch: mode === 'permissive' ? 0.5 : 0.6
  };
  const findings = extractFindings(cwd, { mode });
  const report = reconcile(findings, sanityRules, { mode });
  const out = path.join(cwd, 'learn-report.json');
  fs.writeFileSync(out, JSON.stringify({ findings, ...report }, null, 2), 'utf8');
  console.log(`Wrote ${out}`);
  if (args.fingerprint) {
    const dir = path.join(cwd, '.ai-constants');
try { if (!fs.existsSync(dir)) fs.mkdirSync(dir); } catch { void 0; }
    const file = path.join(dir, 'project-fingerprint.js');
    const content = `export default ${JSON.stringify(report.result, null, 2)}\n`;
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Wrote ${file}`);
  }
  if (args.interactive && args['accept-defaults']) {
    // Minimal interactive default application
    const cfgFile = path.join(cwd, '.ai-coding-guide.json');
    let cfg = {};
try { cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8')); } catch { cfg = {}; }
    cfg.naming = Object.assign({}, cfg.naming || {}, report.result.naming);
    const prevForbidden = (cfg.antiPatterns && cfg.antiPatterns.forbiddenNames) || [];
    const addForbidden = report.result.antiPatterns.forbiddenNames || [];
    const merged = Array.from(new Set([...prevForbidden, ...addForbidden]));
    cfg.antiPatterns = Object.assign({}, cfg.antiPatterns || {}, { forbiddenNames: merged });
    fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
    console.log(`Wrote ${cfgFile}`);
  }
  return 0;
}

module.exports = { learnCommand };
