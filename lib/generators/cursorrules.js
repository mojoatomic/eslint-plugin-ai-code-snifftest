'use strict';

const fs = require('fs');
const path = require('path');

function writeCursorRules(cwd, cfg) {
  const file = path.join(cwd, '.cursorrules');
  const payload = {
    rules: [
      `Primary domain: ${cfg.domains.primary}`,
      `Additional domains: ${cfg.domains.additional.join(', ')}`,
      'Prefer explicit @domain annotations for ambiguous constants.',
      'Use UPPER_SNAKE_CASE for true constants; camelCase for variables.',
      'Boolean vars must be prefixed: is/has/should/can/did/will.'
    ]
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n');
  console.log(`Wrote ${file}`);
}

module.exports = { writeCursorRules };
