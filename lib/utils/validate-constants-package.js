'use strict';

const Ajv = require('ajv');

const schema = {
  type: 'object',
  required: ['domain', 'version', 'constants'],
  additionalProperties: true,
  properties: {
    domain: { type: 'string', pattern: '^[a-z][a-z0-9-]*$' },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    constants: {
      type: 'array',
      items: {
        type: 'object',
        required: ['value', 'name', 'description'],
        additionalProperties: true,
        properties: {
          value: { anyOf: [ { type: 'number' }, { type: 'string' } ] },
          name: { type: 'string', pattern: '^[A-Z][A-Z0-9_]*$' },
          description: { type: 'string', minLength: 6 },
          category: { type: 'string' },
          unit: { type: 'string' },
          alternateNames: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    terms: {
      type: 'object',
      additionalProperties: false,
      properties: {
        entities: { type: 'array', items: { type: 'string' } },
        properties: { type: 'array', items: { type: 'string' } },
        actions: { type: 'array', items: { type: 'string' } }
      }
    },
    naming: {
      type: 'object',
      additionalProperties: true,
      properties: {
        style: { enum: ['camelCase','PascalCase','snake_case'] },
        booleanPrefix: { type: 'array', items: { type: 'string' } },
        asyncPrefix: { type: 'array', items: { type: 'string' } },
        constants: { enum: ['UPPER_SNAKE_CASE','camelCase'] },
        pluralizeCollections: { type: 'boolean' }
      }
    },
    antiPatterns: {
      type: 'object',
      additionalProperties: false,
      properties: {
        forbiddenNames: { type: 'array', items: { type: 'string' } },
        forbiddenTerms: { type: 'array', items: { type: 'string' } }
      }
    }
  }
};

function getValidator() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

function validateConstantsPackage(pkg) {
  const validate = getValidator();
  const ok = validate(pkg);
  if (!ok) {
    const msg = (validate.errors || []).map((e) => `${e.instancePath || '(root)'} ${e.message}`).join('; ');
    throw new Error(`Invalid constants package: ${msg}`);
  }
  return true;
}

module.exports = {
  validateConstantsPackage,
  schema
};