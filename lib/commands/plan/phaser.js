'use strict';

function createPhases(categories, { phases = 4 } = {}) {
  const p = [];
  p.push({ name: 'Quick Wins', items: categories.magicNumbers.slice(0, 100) });
  p.push({ name: 'Domain Cleanup', items: categories.domainTerms.slice(0, 200) });
  p.push({ name: 'Refactoring', items: categories.complexity.slice(0, 50) });
  p.push({ name: 'Polish', items: categories.architecture.slice(0, 200) });
  return p.slice(0, phases);
}

module.exports = { createPhases };