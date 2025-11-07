'use strict';

const fs = require('fs');

function writeAnalysisReport(outPath, { categories, effort, cfg, returnString } = {}) {
  const lines = [];
  lines.push('# Analysis Report');
  lines.push('');
  lines.push(`Errors: ${categories.counts.errors}  Warnings: ${categories.counts.warnings}  Auto-fixable: ${categories.counts.autoFixable}`);
  lines.push('');
  lines.push('## Categories');
  lines.push(`- Magic numbers: ${categories.magicNumbers.length}`);
  lines.push(`- Complexity: ${categories.complexity.length}`);
  lines.push(`- Domain terms: ${categories.domainTerms.length}`);
  lines.push(`- Architecture: ${categories.architecture.length}`);
  lines.push('');
  lines.push('## Effort (rough estimate)');
  lines.push(`- Hours: ${effort.hours}`);
  lines.push(`- Days: ${effort.days}`);
  lines.push(`- Weeks: ${effort.weeks}`);
  lines.push('');
  lines.push('Note: Domain-aware suggestions leverage your configuration (domains.primary/additional).');

  const content = lines.join('\n') + '\n';
  if (returnString) return content;
  fs.writeFileSync(outPath, content);
}

module.exports = { writeAnalysisReport };