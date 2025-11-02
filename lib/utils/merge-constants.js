"use strict";

function mergeConstants(discovered) {
  const merged = {};
  const sources = [discovered.builtin || {}, discovered.npm || {}, discovered.local || {}, discovered.custom || {}];
  for (const src of sources) {
    for (const [domain, data] of Object.entries(src)) {
      if (!merged[domain]) {
        merged[domain] = { domain, constants: [], terms: {}, naming: {}, sources: [] };
      }
      const acc = merged[domain];
      const byValue = new Map(acc.constants.map((c, i) => [String(c.value ?? c), i]));
      for (const c of (data.constants || [])) {
        const key = String(c.value ?? c);
        if (byValue.has(key)) {
          acc.constants[byValue.get(key)] = c; // override
        } else {
          acc.constants.push(c);
          byValue.set(key, acc.constants.length - 1);
        }
      }
      if (data.terms) {
        acc.terms.entities = [ ...(acc.terms.entities || []), ...((data.terms.entities) || []) ];
        acc.terms.properties = [ ...(acc.terms.properties || []), ...((data.terms.properties) || []) ];
        acc.terms.actions = [ ...(acc.terms.actions || []), ...((data.terms.actions) || []) ];
      }
      if (data.naming) {
        acc.naming = { ...acc.naming, ...data.naming };
      }
      acc.sources.push({ type: data.source || 'builtin', package: data.package || data.file || 'builtin' });
    }
  }
  return merged;
}

module.exports = { mergeConstants };