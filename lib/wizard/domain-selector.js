'use strict';

const path = require('path');

function loadConstantsLib() {
  try {
    return require(path.join(__dirname, '..', 'constants'));
  } catch {
    return null;
  }
}

function buildDomainMetadata() {
  const lib = loadConstantsLib();
  const entries = Object.entries((lib && lib.DOMAINS) || {});
  const meta = entries.map(([name, mod]) => {
    const constants = Array.isArray(mod && mod.constants) ? mod.constants : [];
    const terms = Array.isArray(mod && mod.terms) ? mod.terms : [];
    const sources = Array.isArray(mod && mod.sources) ? mod.sources : [];
    return { name, constantsCount: constants.length, termsCount: terms.length, sources };
  });
  meta.sort((a, b) => (b.constantsCount - a.constantsCount) || a.name.localeCompare(b.name));
  return meta;
}

module.exports = {
  buildDomainMetadata
};
