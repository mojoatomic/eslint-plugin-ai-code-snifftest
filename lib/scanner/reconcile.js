"use strict";

function topEntryCount(map) {
  let topKey = null;
  let topVal = 0;
  let total = 0;
  for (const [k, v] of Object.entries(map || {})) {
    total += v;
    if (v > topVal) { topVal = v; topKey = k; }
  }
  const ratio = total ? (topVal / total) : 0;
  return { key: topKey, count: topVal, total, ratio };
}

function reconcileNaming(found, sane) {
  const casingTop = topEntryCount(found.casing || {});
  const style = casingTop.ratio >= (sane.minimumMatch || 0.6) && casingTop.key ? casingTop.key : sane.naming.style;
  const booleanCommon = found.booleanPrefixes && found.booleanPrefixes.common || {};
  const prefixesTop = topEntryCount(booleanCommon);
  const withPrefix = (found.booleanPrefixes?.withPrefix || 0);
  const without = (found.booleanPrefixes?.without || 0);
  const total = withPrefix + without;
  const prefixRatio = total ? (withPrefix / total) : 0;
  const recommendedPrefixes = sane.naming.booleanPrefix || ['is','has','should','can'];
  const adoptedPrefixes = prefixRatio >= (sane.minimumMatch || 0.6) && prefixesTop.key ? [prefixesTop.key] : recommendedPrefixes;

  const warnings = [];
  if (casingTop.ratio < (sane.minimumMatch || 0.6)) {
    warnings.push(`Naming style fragmented; enforcing sane default '${sane.naming.style}'.`);
  }
  if (prefixRatio < (sane.minimumMatch || 0.6)) {
    warnings.push('Boolean prefixes inconsistent; enforcing best-practice prefixes.');
  }

  return {
    style,
    booleanPrefix: adoptedPrefixes,
    warnings
  };
}

function reconcileConstants(found, sane) {
  const minConf = sane.minimumConfidence || 0.7;
  const adopted = [];
  const review = [];
  for (const c of found || []) {
    if ((c.confidence || 0) >= minConf) {
      adopted.push({ value: c.value, domain: c.domain, name: null, needsReview: true });
    } else {
      review.push({ value: c.value, domain: c.domain, reason: 'low-confidence' });
    }
  }
  const warnings = [];
  if (!adopted.length && (found?.length || 0) > 0) warnings.push('Found constants but none met confidence threshold; flagging for review.');
  return { adopted, review, warnings };
}

function reconcileAntiPatterns(found) {
  const forbidden = Object.keys(found || {});
  const warnings = forbidden.length ? [`Detected generic names: ${forbidden.join(', ')}`] : [];
  return { forbiddenNames: forbidden, warnings };
}

function scoreQuality(parts) {
  let score = 0;
  // Naming style confidence
  score += parts.namingStyleOk ? 25 : 15;
  // Boolean prefixes
  score += parts.booleanOk ? 25 : 15;
  // Constants adoption
  const constRatio = parts.constantsTotal ? (parts.constantsAdopted / parts.constantsTotal) : 0;
  score += Math.round(constRatio * 25);
  // Anti-patterns penalty
  const penalty = Math.min(parts.antiPatternsCount * 2, 20);
  score += (25 - penalty);
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  return score;
}

function reconcile(findings, sanityRules, options = {}) {
  const naming = reconcileNaming(findings.naming || {}, sanityRules, options);
  const constants = reconcileConstants(findings.constants || [], sanityRules, options);
  const anti = reconcileAntiPatterns(findings.genericNames || {});

  const namingStyleOk = naming.warnings.length === 0;
  const booleanOk = naming.warnings.every(w => !/Boolean prefixes/.test(w));
  const constantsTotal = (findings.constants || []).length;
  const constantsAdopted = constants.adopted.length;
  const antiPatternsCount = Object.keys(findings.genericNames || {}).length;
  const score = scoreQuality({ namingStyleOk, booleanOk, constantsTotal, constantsAdopted, antiPatternsCount });

  const warnings = [...naming.warnings, ...constants.warnings, ...anti.warnings];
  const recommendations = [];
  if (!namingStyleOk) recommendations.push(`Set naming.style='${sanityRules.naming.style}' and migrate minority styles.`);
  if (antiPatternsCount) recommendations.push('Refactor generic names to domain-specific, descriptive names.');

  const result = {
    naming: { style: naming.style, booleanPrefix: naming.booleanPrefix },
    constants: constants.adopted,
    antiPatterns: { forbiddenNames: anti.forbiddenNames },
    warnings,
    recommendations,
    score
  };

  return { result };
}

module.exports = {
  reconcile,
  reconcileNaming,
  reconcileConstants,
  reconcileAntiPatterns
};