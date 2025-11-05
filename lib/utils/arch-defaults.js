'use strict';

function deepFreeze(obj) {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    if (obj[prop] !== null && (typeof obj[prop] === 'object' || typeof obj[prop] === 'function') && !Object.isFrozen(obj[prop])) {
      deepFreeze(obj[prop]);
    }
  });
  return obj;
}

const DEFAULT_ARCHITECTURE = deepFreeze({
  fileStructure: {
    pattern: 'feature-based'
  },
  maxFileLength: {
    cli: 100,
    command: 150,
    util: 200,
    generator: 250,
    component: 300,
    default: 250
  },
  organization: {
    commands: 'lib/commands/{command}/',
    utils: 'lib/utils/',
    generators: 'lib/generators/',
    tests: 'tests/'
  },
  functions: {
    maxLength: 50,
    maxComplexity: 10,
    maxDepth: 4,
    maxParams: 4,
    maxStatements: 30,
    singlePurpose: true,
    preferPure: true
  },
  patterns: {
    cliStyle: 'orchestration-shell',
    errorHandling: 'explicit',
    asyncStyle: 'async-await'
  }
});

/**
 * Merge user architecture config with defaults
 * @param {object} userArch - User-provided architecture config
 * @returns {object} Merged architecture config
 */
function mergeArchitecture(userArch) {
  if (!userArch || typeof userArch !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_ARCHITECTURE));
  }

  const merged = JSON.parse(JSON.stringify(DEFAULT_ARCHITECTURE));

  // Merge fileStructure
  if (userArch.fileStructure && typeof userArch.fileStructure === 'object') {
    Object.assign(merged.fileStructure, userArch.fileStructure);
  }

  // Merge maxFileLength
  if (userArch.maxFileLength && typeof userArch.maxFileLength === 'object') {
    Object.assign(merged.maxFileLength, userArch.maxFileLength);
  }

  // Merge organization
  if (userArch.organization && typeof userArch.organization === 'object') {
    Object.assign(merged.organization, userArch.organization);
  }

  // Merge functions
  if (userArch.functions && typeof userArch.functions === 'object') {
    Object.assign(merged.functions, userArch.functions);
  }

  // Merge patterns
  if (userArch.patterns && typeof userArch.patterns === 'object') {
    Object.assign(merged.patterns, userArch.patterns);
  }

  return merged;
}

module.exports = {
  DEFAULT_ARCHITECTURE,
  mergeArchitecture
};
