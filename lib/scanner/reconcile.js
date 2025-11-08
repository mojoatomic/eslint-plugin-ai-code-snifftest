'use strict';


const constantsLib = (()=>{ try { return require('../constants'); } catch { return null; }})();

const DEFAULT_SANITY = Object.freeze({
  naming: {
    style: 'camelCase',
    constants: 'UPPER_SNAKE_CASE',
    booleanPrefix: ['is','has','should','can']
  },
  minimumConfidence: 0.7,
  minimumMatch: 0.6
});

function bestNamingStyle(casingCounts) {
  let best = { style: 'camelCase', count: -1 };
  for (const [style, count] of Object.entries(casingCounts || {})) {
    if (count > best.count && style !== 'other') best = { style, count };
  }
  return best.style;
}

function reconcileNaming(found, sane, mode) {
  const casing = (found && found.casing) || {};
  const total = Object.values(casing).reduce((a,b)=>a+b,0) || 1;
  const best = bestNamingStyle(casing);
  const majority = (casing[best] || 0) / total;
  const result = { style: sane.naming.style, booleanPrefix: sane.naming.booleanPrefix.slice() };
  const warnings = [];
  if (mode === 'strict') {
    result.style = sane.naming.style;
  } else if (mode === 'permissive') {
    // Prefer current majority regardless of threshold
    result.style = best || sane.naming.style;
  } else {
    if (majority >= (sane.minimumMatch || 0.6)) {
      result.style = best;
    } else {
      warnings.push(`Weak naming majority (${Math.round(majority*100)}%) → using sane default '${sane.naming.style}'`);
    }
  }
  // boolean prefixes: keep sane list but ensure the most common in found are included
  const dist = (found.booleanPrefixes && found.booleanPrefixes.distribution) || {};
  const common = Object.keys(dist).sort((a,b)=> (dist[b]-dist[a])).slice(0,4);
  for (const p of common) if (!result.booleanPrefix.includes(p)) result.booleanPrefix.push(p);
  if (mode === 'strict') {
    // reset to sane-only list in strict
    result.booleanPrefix = sane.naming.booleanPrefix.slice();
  }
  return { result, warnings };
}

function findConstantMeta(value) {
  if (!constantsLib || !constantsLib.DOMAINS) return null;
  for (const [domain, mod] of Object.entries(constantsLib.DOMAINS)) {
    const arr = Array.isArray(mod.constantMeta) ? mod.constantMeta : [];
    for (const m of arr) {
      if (typeof m.value === 'number' && Math.abs(m.value - value) <= 1e-9) {
        return { domain, name: m.name, description: m.description };
      }
    }
  }
  // fallback: try bare constants list to get domain only
  const dom = constantsLib.getDomainForValue ? constantsLib.getDomainForValue(value) : null;
  if (dom) return { domain: dom, name: null, description: null };
  return null;
}

function reconcileConstants(found, sane, options) {
  const out = [];
  const warnings = [];
  const domainHits = [];
  const minConf = sane.minimumConfidence || 0.7;
  const cfg = (options && options.config) || { domainPriority: [], constantResolution: {} };
  for (const c of (found || [])) {
    if (c.confidence < minConf) continue;
    const forceDomain = cfg.constantResolution && cfg.constantResolution[String(c.value)];
    const meta = findConstantMeta(c.value);
    let domain = forceDomain || (meta && meta.domain) || null;
    // prefer configured domainPriority when multiple plausible domains (not fully detectable here)
    if (!domain && constantsLib && constantsLib.getDomainForValue) {
      domain = constantsLib.getDomainForValue(c.value);
    }
    let suggestedName = (meta && meta.name) || null;
    if (!suggestedName && typeof c.value === 'number') {
      // generic name from domain
      if (domain === 'astronomy' && Math.abs(c.value - 365.25) <= 1e-9) suggestedName = 'TROPICAL_YEAR_DAYS';
      else if (domain === 'time' && Math.abs(c.value - 86400) <= 1e-9) suggestedName = 'SECONDS_PER_DAY';
      else if (domain === 'time' && Math.abs(c.value - 1000) <= 1e-9) suggestedName = 'MS_PER_SECOND';
    }
    if (domain) domainHits.push(domain);
    out.push({ value: c.value, confidence: c.confidence, domain, suggestedName });
  }
  // domain summary
  const domCount = domainHits.reduce((acc,d)=>{ acc[d]=(acc[d]||0)+1; return acc; },{});
  return { result: out, warnings, domainSummary: domCount };
}

function reconcileAntiPatterns(found, mode) {
  const out = { forbiddenNames: [] };
  const warnings = [];
  const entries = Object.entries(found || {}).sort((a,b)=> b[1]-a[1]);
  const thr = mode === 'permissive' ? 5 : 3;
  for (const [name, count] of entries.slice(0, 10)) {
    if (count >= thr) out.forbiddenNames.push(name);
  }
  if (!out.forbiddenNames.length) warnings.push('No strong generic names found to forbid.');
  return { result: out, warnings };
}

function computeQualityScore(findings, sane) {
  const casing = findings.naming && findings.naming.casing || {};
  const total = Object.values(casing).reduce((a,b)=>a+b,0) || 1;
  const best = bestNamingStyle(casing);
  const majority = (casing[best] || 0) / total;
  const namingScore = Math.round(Math.min(1, Math.max(0, (majority - 0.4) / 0.6)) * 100);
  const bool = findings.naming && findings.naming.booleanPrefixes || { withPrefix: 0, without: 0 };
  const boolScore = Math.round(Math.min(1, (bool.withPrefix + 1) / (bool.withPrefix + bool.without + 1)) * 100);
  const genTotal = Object.values(findings.genericNames || {}).reduce((a,b)=>a+b,0);
  const genScore = Math.round(100 - Math.min(100, genTotal));
  const constHigh = (findings.constants || []).filter(c=> c.confidence >= (sane.minimumConfidence || 0.7)).length;
  const constScore = Math.min(100, 50 + constHigh * 10);
  const overall = Math.round((namingScore*0.3 + boolScore*0.2 + genScore*0.2 + constScore*0.3));
  return { overall, breakdown: { naming: namingScore, booleanPrefixes: boolScore, genericNames: genScore, constants: constScore }, notes: [] };
}

function reconcile(findings, sanityRules, options) {
  const sane = Object.assign({}, DEFAULT_SANITY, sanityRules || {});
  const warnings = [];
  const recommendations = [];
  const conflicts = [];

  const mode = (options && options.mode) || 'adaptive';
  const namingR = reconcileNaming(findings.naming || {}, sane, mode);
  warnings.push(...namingR.warnings);

  const constR = reconcileConstants(findings.constants || [], sane, options);
  warnings.push(...constR.warnings);

  const antiR = reconcileAntiPatterns(findings.genericNames || {}, mode);
  warnings.push(...(antiR.warnings||[]));

  const score = computeQualityScore(findings, sane);

  const result = {
    naming: namingR.result,
    antiPatterns: antiR.result,
    constantResolution: (options && options.config && options.config.constantResolution) || {},
  };

  return {
    domain: { constants: constR.result, summary: constR.domainSummary },
    result,
    warnings,
    recommendations,
    conflicts,
    score
  };
}

function generateDomain(result) {
  const items = (result && result.constants) || [];
  const lines = [
    "// Generated by 'learn' reconciliation",
    "'use strict';",
    'module.exports = {',
    '  constants: [',
    ...items.map(c => `    { value: ${c.value}, name: ${c.suggestedName ? `'${c.suggestedName}'` : 'null'}, domain: ${c.domain ? `'${c.domain}'` : 'null'} },`),
    '  ]',
    '};',
    ''
  ];
  return lines.join('\n');
}

module.exports = {
  DEFAULT_SANITY: DEFAULT_SANITY,
  reconcile,
  reconcileNaming,
  reconcileConstants,
  reconcileAntiPatterns,
  computeQualityScore,
  generateDomain
};