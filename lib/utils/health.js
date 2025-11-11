'use strict';

function num(x) { return typeof x === 'number' && Number.isFinite(x) ? x : 0; }

/**
 * Compute health scores based on violation density per 1K executable LOC.
 * Expects a summary with fields: lines.executable (or physical) and counts per category.
 * Returns integers 0..100 for overall, structural, semantic.
 */
function computeHealth(summary) {
  const exec = Math.max(1, num(summary && summary.lines && summary.lines.executable) || num(summary && summary.lines && summary.lines.physical) || 1000);
  const total = num(summary && summary.magicNumbers) + num(summary && summary.complexity) + num(summary && summary.domainTerms) + num(summary && summary.architecture);
  const structuralTotal = num(summary && summary.complexity) + num(summary && summary.architecture);
  const semanticTotal = num(summary && summary.domainTerms) + num(summary && summary.magicNumbers);
  const perK = total / (exec / 1000);
  const perKStructural = structuralTotal / (exec / 1000);
  const perKSemantic = semanticTotal / (exec / 1000);
  const toScore = (d) => Math.max(0, Math.min(100, 100 - d * 10));
  return {
    overall: Math.round(toScore(perK)),
    structural: Math.round(toScore(perKStructural)),
    semantic: Math.round(toScore(perKSemantic))
  };
}

module.exports = { computeHealth };