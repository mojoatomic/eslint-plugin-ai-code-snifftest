'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.cache']);

function listFiles(root, exts, maxFiles) {
  const out = [];
  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { /* ignore */ return; }
    for (const ent of entries) {
      if (ent.name.startsWith('.')) {
        // allow .ai-* files but skip hidden dirs by default
        if (ent.isDirectory() && ent.name !== '.ai-constants') continue;
      }
      if (ent.isDirectory()) {
        if (DEFAULT_IGNORE_DIRS.has(ent.name)) continue;
        walk(path.join(dir, ent.name));
        if (maxFiles && out.length >= maxFiles) return;
      } else {
        const fp = path.join(dir, ent.name);
        const ext = path.extname(ent.name).toLowerCase();
        if (!exts.length || exts.includes(ext)) {
          out.push(fp);
        }
        if (maxFiles && out.length >= maxFiles) return;
      }
    }
  }
  walk(root);
  return out;
}

function tokenizeNamesFromSource(src) {
  const names = [];
  try {
    const declRe = /(const|let|var|function)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
    let m;
    while ((m = declRe.exec(src))) {
      names.push(m[2]);
    }
    // capture object properties as names too (heuristic)
    const propRe = /([A-Za-z_$][A-Za-z0-9_$]*)\s*:/g;
    while ((m = propRe.exec(src))) {
      names.push(m[1]);
    }
  } catch {
    // ignore parse heuristics errors
  }
  return names;
}

function classifyCasing(name) {
  if (!name) return 'other';
  
  // Strip leading/trailing _ or $ for classification, but track them
  const stripped = name.replace(/^[_$]+|[_$]+$/g, '');
  if (!stripped) return 'other';  // names like "_" or "$" or "__"
  
  // Classify the stripped name
  if (/^[A-Z0-9_]+$/.test(stripped) && /_/.test(stripped)) return 'UPPER_SNAKE_CASE';
  if (/^[a-z][A-Za-z0-9]*$/.test(stripped) && /[A-Z]/.test(stripped)) return 'camelCase';
  if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(stripped)) return 'snake_case';
  if (/^[A-Z][A-Za-z0-9]*$/.test(stripped)) return 'PascalCase';
  if (/^[a-z][a-z0-9]*$/.test(stripped)) return 'camelCase';  // single-word lowercase
  
  return 'other';
}

function booleanPrefix(name) {
  const prefixes = ['is','has','should','can','did','will','was','were'];
  for (const p of prefixes) {
    if (name && name.startsWith(p) && name.length > p.length && /[A-Z_]/.test(name[p.length])) return p;
  }
  return null;
}

function extractNumerics(src) {
  const out = [];
  const numRe = /(?<![A-Za-z0-9_.])(?:\d+\.\d+|\d+)(?:[eE][+-]?\d+)?/g;
  let m;
  while ((m = numRe.exec(src))) {
    const raw = m[0];
    const v = Number(raw);
    if (!Number.isFinite(v)) continue;
    out.push(v);
  }
  return out;
}

function loadCache(cachePath) {
  try { return JSON.parse(fs.readFileSync(cachePath, 'utf8')); } catch { return { version: 1, files: {} }; }
}

function saveCache(cachePath, cache) {
  try { fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2) + '\n'); } catch { /* ignore cache write */ }
}

function summarizeFileContent(src) {
  const names = tokenizeNamesFromSource(src);
  const casing = { camelCase: 0, 'snake_case': 0, PascalCase: 0, 'UPPER_SNAKE_CASE': 0, other: 0 };
  const boolDist = {};
  let withPrefix = 0;
  let without = 0;
  const genericList = ['data','result','value','info','item','object','obj','arr','array','list','tmp','temp','str','num','bool','flag','state'];
  const genericNames = {};
  for (const n of names) {
    const c = classifyCasing(n);
    casing[c] = (casing[c] || 0) + 1;
    const bp = booleanPrefix(n);
    if (bp) { withPrefix++; boolDist[bp] = (boolDist[bp] || 0) + 1; } else { without++; }
    if (genericList.includes(n)) genericNames[n] = (genericNames[n] || 0) + 1;
  }
  const nums = extractNumerics(src);
  const constCounts = {};
  for (const v of nums) constCounts[v] = (constCounts[v] || 0) + 1;
  const constants = Object.entries(constCounts).map(([value, count]) => ({ value: Number(value), count }));
  return {
    constants,
    naming: {
      casing,
      booleanPrefixes: {
        withPrefix,
        without,
        distribution: boolDist,
        common: Object.keys(boolDist).sort((a,b)=> (boolDist[b]-boolDist[a]))
      }
    },
    genericNames
  };
}

function aggregateSummaries(summaries) {
  const out = { constants: [], naming: { casing: {}, booleanPrefixes: { withPrefix: 0, without: 0, common: [], distribution: {} } }, genericNames: {} };
  const constMap = new Map();
  for (const s of summaries) {
    for (const [k,v] of Object.entries(s.naming.casing || {})) out.naming.casing[k] = (out.naming.casing[k] || 0) + v;
    out.naming.booleanPrefixes.withPrefix += s.naming.booleanPrefixes.withPrefix || 0;
    out.naming.booleanPrefixes.without += s.naming.booleanPrefixes.without || 0;
    for (const [k,v] of Object.entries(s.naming.booleanPrefixes.distribution || {})) out.naming.booleanPrefixes.distribution[k] = (out.naming.booleanPrefixes.distribution[k] || 0) + v;
    for (const [k,v] of Object.entries(s.genericNames || {})) out.genericNames[k] = (out.genericNames[k] || 0) + v;
    for (const c of s.constants || []) constMap.set(c.value, (constMap.get(c.value) || 0) + c.count);
  }
  out.constants = Array.from(constMap.entries()).map(([value, count]) => ({ value, count })).sort((a,b)=>b.count-a.count);
  out.naming.booleanPrefixes.common = Object.keys(out.naming.booleanPrefixes.distribution).sort((a,b)=> (out.naming.booleanPrefixes.distribution[b]-out.naming.booleanPrefixes.distribution[a]));
  // Convert to issue-style findings with confidence
  const totalConst = out.constants.reduce((acc,c)=>acc+c.count,0) || 1;
  out.constants = out.constants.map(c => ({ value: Number(c.value), name: null, confidence: Math.min(1, c.count / Math.max(3, totalConst)) }));
  return out;
}

function scanProject(cwd, options) {
  const opts = Object.assign({ sample: 400, useCache: true, cachePath: path.join(cwd, '.ai-learn-cache.json') }, options || {});
  const files = listFiles(cwd, ['.js','.cjs','.mjs'], opts.sample);
  const cache = opts.useCache ? loadCache(opts.cachePath) : { version: 1, files: {} };
  const summaries = [];
  for (const fp of files) {
    let st; try { st = fs.statSync(fp); } catch { continue; }
    const prev = cache.files[fp];
    if (prev && prev.mtimeMs === st.mtimeMs) {
      summaries.push(prev.summary);
      continue;
    }
    let src; try { src = fs.readFileSync(fp, 'utf8'); } catch { continue; }
    const summary = summarizeFileContent(src);
    summaries.push(summary);
    cache.files[fp] = { mtimeMs: st.mtimeMs, summary };
  }
  if (opts.useCache) saveCache(opts.cachePath, cache);
  return aggregateSummaries(summaries);
}

module.exports = {
  scanProject,
  summarizeFileContent,
  aggregateSummaries
};