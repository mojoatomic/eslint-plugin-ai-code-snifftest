"use strict";

const fs = require("fs");
const path = require("path");
const {
  isPhysicalConstant,
  getDomainForValue
} = require("../constants");

function walk(dir, ignoreDirs) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue;
      out.push(...walk(p, ignoreDirs));
    } else {
      out.push(p);
    }
  }
  return out;
}

function detectCasing(name) {
  if (!name) return null;
  if (/^[A-Z0-9_]+$/.test(name)) return "UPPER_SNAKE_CASE";
  if (/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(name)) return "snake_case";
  if (/^[A-Z][A-Za-z0-9]*$/.test(name)) return "PascalCase";
  if (/^[a-z][A-Za-z0-9]*$/.test(name)) return "camelCase";
  return null;
}

function extractIdentifiersAndNumbers(text) {
  const ids = [];
  const nums = [];
  // crude captures: const/let/var/function/class declarations
  const reDecl = /(const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = reDecl.exec(text))) {
    ids.push(m[2]);
  }
  const reNums = /\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/gi;
  while ((m = reNums.exec(text))) {
    const v = Number(m[0]);
    if (!Number.isNaN(v)) nums.push(v);
  }
  return { ids, nums };
}

function extractFindings(cwd) {
  const ignore = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage"
  ]);
  const roots = [cwd];
  const files = [];
  for (const r of roots) {
    try {
      for (const f of walk(r, ignore)) files.push(f);
} catch { /* ignore traversal errors */ }
  }
  const findings = {
    constants: [],
    naming: {
      casing: {},
      booleanPrefixes: { withPrefix: 0, without: 0, common: {} }
    },
    genericNames: {}
  };

  const genericSet = new Set(["data", "result"]);

  for (const f of files) {
    if (!/\.(m?js|cjs|jsx|ts|tsx)$/i.test(f)) continue;
    if (f.includes(`${path.sep}.ai-constants${path.sep}`)) continue;
    let text;
    try { text = fs.readFileSync(f, "utf8"); } catch { continue; }
    const { ids, nums } = extractIdentifiersAndNumbers(text);

    for (const id of ids) {
      const lower = id.toLowerCase();
      // naming style
      const style = detectCasing(id);
      if (style) findings.naming.casing[style] = (findings.naming.casing[style] || 0) + 1;
      // boolean prefixes
      if (/^(is|has|should|can)[A-Z_]/.test(id)) {
        findings.naming.booleanPrefixes.withPrefix++;
        const prefix = lower.match(/^(is|has|should|can)/)[1];
        findings.naming.booleanPrefixes.common[prefix] = (findings.naming.booleanPrefixes.common[prefix] || 0) + 1;
      } else {
        findings.naming.booleanPrefixes.without++;
      }
      // generic names
      if (genericSet.has(lower)) {
        findings.genericNames[lower] = (findings.genericNames[lower] || 0) + 1;
      }
    }

    for (const n of nums) {
      if (isPhysicalConstant(n)) {
        findings.constants.push({ value: n, confidence: 1.0, domain: getDomainForValue(n) });
      }
    }
  }

  return findings;
}

module.exports = {
  extractFindings
};