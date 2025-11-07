'use strict';

function round1(x) { return Math.round(x * 10) / 10; }

function estimateEffort(categories) {
  const c = categories || {};
  const magicH = (c.magicNumbers?.length || 0) * 0.05;
  const domainH = (c.domainTerms?.length || 0) * 0.08;
  const archH = (c.architecture?.length || 0) * 0.1;
  const compH = (c.complexity?.length || 0) * 1.5; // complexity is heavier
  const hours = magicH + domainH + archH + compH;
  const days = hours / 8;
  const weeks = days / 5;
  return {
    hours: round1(hours),
    days: round1(days),
    weeks: round1(weeks),
    byCategory: {
      magicNumbers: round1(magicH),
      domainTerms: round1(domainH),
      architecture: round1(archH),
      complexity: round1(compH)
    }
  };
}

module.exports = { estimateEffort };
