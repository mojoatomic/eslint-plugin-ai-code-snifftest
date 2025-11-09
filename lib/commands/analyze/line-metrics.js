'use strict';

const path = require('path');
const { getFileLineMetrics } = require(path.join(__dirname, '..', '..', 'metrics', 'line-counter'));

function normalizeMetricsFlags(cfg) {
  const metricsCfg = (cfg && cfg.ratchet && cfg.ratchet.metrics) || {};
  // Default true unless explicitly false
  const flag = (key) => !Object.prototype.hasOwnProperty.call(metricsCfg, key) || Boolean(metricsCfg[key]);
  return {
    trackPhysical: flag('trackPhysicalLines'),
    trackExecutable: flag('trackExecutableLines'),
    trackCommentRatio: flag('trackCommentRatio')
  };
}

function computeAggregateLineMetrics(cwd, eslintJson, cfg) {
  const filesArr = Array.isArray(eslintJson) ? eslintJson : [];
  const mode = (cfg && cfg.ratchet && cfg.ratchet.lineCountMode) || 'executable';
  const flags = normalizeMetricsFlags(cfg);

  // Collect file metrics for files that have real paths
  const metrics = filesArr
    .map((f) => (f && typeof f.filePath === 'string' ? f.filePath : null))
    .filter(Boolean)
    .map((p) => (path.isAbsolute(p) ? p : path.join(cwd, p)))
    .map((abs) => getFileLineMetrics(abs))
    .filter(Boolean);

  // Aggregate totals using reducers (keeps function complexity low)
  const physical = flags.trackPhysical
    ? metrics.reduce((sum, m) => sum + (m.physical || 0), 0)
    : 0;
  const executable = flags.trackExecutable
    ? metrics.reduce((sum, m) => sum + (m.executable || 0), 0)
    : 0;

  const comments = Math.max(0, physical - executable);
  const commentRatio = flags.trackCommentRatio && physical > 0 ? comments / physical : 0;

  return { lines: { physical, executable, comments, commentRatio }, mode };
}

module.exports = { computeAggregateLineMetrics };
