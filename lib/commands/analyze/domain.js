'use strict';

const path = require('path');
const constantsLib = require(path.join(__dirname, '..', '..', '..', 'lib', 'constants'));

function buildDomainData(cfg) {
  const priority = Array.isArray(cfg.domainPriority) ? cfg.domainPriority : [];
  const domains = Object.keys(constantsLib.DOMAINS);
  const byDomain = {};
  for (const d of domains) {
    const mod = constantsLib.getDomain(d);
    if (!mod) continue;
    const constants = Array.isArray(mod.constants) ? mod.constants.slice() : [];
    const terms = Array.isArray(mod.terms) ? mod.terms.map(String) : [];
    byDomain[d] = { constants, terms };
  }
  return { byDomain, priority };
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
  const domainCounts = {};
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
  const summary = Object.entries(domainCounts)
    .map(([domain, count]) => ({ domain, count, rank: (dd.priority.indexOf(domain) !== -1 ? dd.priority.indexOf(domain) : 999) }))
    .sort((a, b) => (b.count - a.count) || (a.rank - b.rank));
  categories.domainSummary = summary;
  return categories;
}

module.exports = { buildDomainData, inferDomainForMessage, attachDomainContext };