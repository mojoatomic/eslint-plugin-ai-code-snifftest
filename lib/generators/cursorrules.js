"use strict";

function generateCursorrules(cfg) {
  const payload = {
    rules: [
      `Primary domain: ${cfg.domains.primary}`,
      `Additional domains: ${cfg.domains.additional.join(', ')}`,
      'Prefer explicit @domain annotations for ambiguous constants.',
      'Use UPPER_SNAKE_CASE for true constants; camelCase for variables.',
      'Boolean vars must be prefixed: is/has/should/can/did/will.'
    ]
  };
  return JSON.stringify(payload, null, 2) + '\n';
}

module.exports = {
  generateCursorrules
};
