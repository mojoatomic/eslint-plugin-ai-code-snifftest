'use strict';

function estimateEffort(categories) {
  const c = categories || {};
  const hours =
    (c.magicNumbers?.length || 0) * 0.05 +
    (c.domainTerms?.length || 0) * 0.08 +
    (c.architecture?.length || 0) * 0.1 +
    (c.complexity?.length || 0) * 1.5; // complexity is heavier
  const days = hours / 8;
  const weeks = days / 5;
  return { hours: Math.round(hours * 10) / 10, days: Math.round(days * 10) / 10, weeks: Math.round(weeks * 10) / 10 };
}

module.exports = { estimateEffort };