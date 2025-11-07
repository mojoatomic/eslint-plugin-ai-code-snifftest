'use strict';

const fs = require('fs');

function writeRoadmap(outPath, { phases, categories } = {}) {
  const lines = [];
  lines.push('# FIXES Roadmap');
  lines.push('');
  phases.forEach((ph, idx) => {
    lines.push(`## Phase ${idx + 1}: ${ph.name}`);
    lines.push(`Items: ${ph.items.length}`);
    lines.push('');
  });
  fs.writeFileSync(outPath, lines.join('\n') + '\n');
}

module.exports = { writeRoadmap };