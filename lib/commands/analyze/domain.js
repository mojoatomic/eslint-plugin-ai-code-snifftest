'use strict';

const path = require('path');
const constantsLib = require(path.join(__dirname, '..', '..', '..', 'lib', 'constants'));

function resolveAllowedDomains(cfg) {
  const raw = (cfg && cfg.domains) ? [cfg.domains.primary].concat(cfg.domains.additional || []) : [];
  const allowed = raw.filter(Boolean);
  const existing = Object.keys(constantsLib.DOMAINS);
  if (allowed.length) return allowed; // honor configured domains even if not in catalog
  return existing; // fallback to all only when nothing configured
}

function buildDomainData(cfg) {
  const priority = Array.isArray(cfg.domainPriority) ? cfg.domainPriority : [];
  const allowed = resolveAllowedDomains(cfg);
  const byDomain = {};
  for (const d of allowed) {
    const mod = constantsLib.getDomain(d);
    if (!mod) continue;
    const constants = Array.isArray(mod.constants) ? mod.constants.slice() : [];
    const terms = Array.isArray(mod.terms) ? mod.terms.map(String) : [];
    byDomain[d] = { constants, terms };
  }
  return { byDomain, priority, allowed };
}

function inferDomainForMessage(message, domainData) {
  if (!message) return null;
  const msg = String(message);
  
  // search numeric constants first (exact string match)
  for (const [domain, data] of Object.entries(domainData.byDomain)) {
    for (const v of data.constants) {
      if (msg.includes(String(v))) return domain;
    }
  }
  
  // then look for known terms
  const lower = msg.toLowerCase();
  let bestMatch = null;
  for (const [domain, data] of Object.entries(domainData.byDomain)) {
    for (const term of data.terms) {
      const lowerTerm = String(term).toLowerCase();
      if (lowerTerm && lower.includes(lowerTerm)) {
        if (!bestMatch || lowerTerm.length > bestMatch.len) {
          bestMatch = { domain, len: lowerTerm.length };
        }
      }
    }
  }
  return bestMatch ? bestMatch.domain : null;
}

function attachDomainContext(categories, cfg) {
  const dd = buildDomainData(cfg || {});
  const domainCounts = Object.create(null);
  function annotate(list) {
    for (const rec of list) {
      const d = inferDomainForMessage(rec.message, dd);
      if (d) {
        rec.domain = d; // annotate
        domainCounts[d] = (domainCounts[d] || 0) + 1;
      }
    }
  }
  annotate(categories.magicNumbers || []);
  annotate(categories.domainTerms || []);
  annotate(categories.complexity || []);
  annotate(categories.architecture || []);
  // Build summary restricted to allowed domains, include zero-counts
  const summary = dd.allowed.map((domain) => ({
    domain,
    count: domainCounts[domain] || 0,
    rank: (dd.priority.indexOf(domain) !== -1 ? dd.priority.indexOf(domain) : 999)
  })).sort((a, b) => (b.count - a.count) || (a.rank - b.rank));
  categories.domainSummary = summary;
  return categories;
}

function getDomainHints(categories, cfg) {
  // Build domain data across all known domains to infer hints
  const all = { byDomain: {}, priority: [], allowed: Object.keys(constantsLib.DOMAINS) };
  for (const d of Object.keys(constantsLib.DOMAINS)) {
    const mod = constantsLib.getDomain(d);
    if (!mod) continue;
    all.byDomain[d] = {
      constants: Array.isArray(mod.constants) ? mod.constants.slice() : [],
      terms: Array.isArray(mod.terms) ? mod.terms.map(String) : []
    };
  }
  const counts = Object.create(null);
  function annotate(list) {
    for (const rec of list || []) {
      const d = inferDomainForMessage(rec.message, all);
      if (d) counts[d] = (counts[d] || 0) + 1;
    }
  }
  annotate(categories.magicNumbers || []);
  annotate(categories.domainTerms || []);
  annotate(categories.complexity || []);
  annotate(categories.architecture || []);
  // Exclude configured allowed domains
  const allowed = resolveAllowedDomains(cfg || {});
  const hints = Object.entries(counts)
    .filter(([d]) => !allowed.includes(d))
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  return hints;
}

module.exports = { buildDomainData, inferDomainForMessage, attachDomainContext, getDomainHints };
