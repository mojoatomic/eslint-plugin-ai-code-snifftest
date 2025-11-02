/**
 * @fileoverview Enforce naming conventions from project config (style, boolean/async prefixes, plural collections)
 */
"use strict";

/* eslint-disable eslint-plugin/require-meta-has-suggestions */

const { readProjectConfig } = require('../utils/project-config');

function isCamelCase(name) { return /^[a-z][a-zA-Z0-9]*$/.test(name); }
function isSnakeCase(name) { return /^[a-z][a-z0-9_]*$/.test(name) && !/[A-Z]/.test(name); }
function isPascalCase(name) { return /^[A-Z][a-zA-Z0-9]*$/.test(name); }

function words(name) {
  return String(name || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

function toCamelCase(name) {
  const ws = words(name);
  if (!ws.length) return name;
  return ws[0] + ws.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

function toSnakeCase(name) {
  return words(name).join('_');
}

function toPascalCase(name) {
  return words(name).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

function enforceStyle(name, style) {
  switch (style) {
    case 'camelCase': return isCamelCase(name) ? null : toCamelCase(name);
    case 'snake_case': return isSnakeCase(name) ? null : toSnakeCase(name);
    case 'PascalCase': return isPascalCase(name) ? null : toPascalCase(name);
    default: return null;
  }
}

function ensureBooleanPrefix(name, prefixes) {
  if (!prefixes || !prefixes.length) return null;
  for (const p of prefixes) {
    if (name.startsWith(p)) return null;
  }
  const base = toPascalCase(name);
  return `${prefixes[0]}${base}`;
}

function ensureAsyncPrefix(name, prefixes) {
  if (!prefixes || !prefixes.length) return null;
  for (const p of prefixes) {
    if (name.startsWith(p)) return null;
  }
  const base = toPascalCase(name);
  return `${prefixes[0]}${base}`;
}

function isCollectionInit(init) {
  if (!init) return false;
  if (init.type === 'ArrayExpression') return true;
  if (init.type === 'NewExpression' && init.callee && init.callee.type === 'Identifier') {
    const n = init.callee.name;
    return n === 'Set' || n === 'Map' || n === 'WeakSet' || n === 'WeakMap';
  }
  return false;
}

function pluralize(name) {
  if (/s$/.test(name)) return name; // naive OK
  if (/y$/.test(name)) return name.replace(/y$/, 'ies');
  return `${name}s`;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce naming conventions from project config (style, boolean/async prefixes, plural collections)',
      recommended: false,
      url: null,
    },
    hasSuggestions: true,
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          style: { enum: ['camelCase','snake_case','PascalCase'] },
          booleanPrefix: { type: 'array', items: { type: 'string' } },
          asyncPrefix: { type: 'array', items: { type: 'string' } },
          pluralizeCollections: { type: 'boolean' },
          exemptNames: { type: 'array', items: { type: 'string' } },
          maxSuggestions: { type: 'number' }
        },
        additionalProperties: false,
      }
    ],
    messages: {
      wrongStyle: 'Identifier "{{name}}" should follow {{style}} style',
      booleanPrefix: 'Boolean identifier "{{name}}" should start with one of: {{prefixes}}',
      asyncPrefix: 'Async function "{{name}}" should start with one of: {{prefixes}}',
      pluralCollection: 'Collection "{{name}}" should be pluralized',
      suggestRename: 'Rename to: {{suggestion}}'
    },
  },

  create(context) {
    const project = readProjectConfig(context) || {};
    const cfg = project.naming || {};
    const opt = (context.options && context.options[0]) || {};
    const style = opt.style || cfg.style || 'camelCase';
    const booleanPrefixes = opt.booleanPrefix || cfg.booleanPrefix || [];
    const asyncPrefixes = opt.asyncPrefix || cfg.asyncPrefix || [];
    const pluralizeFlag = typeof opt.pluralizeCollections === 'boolean' ? opt.pluralizeCollections : (cfg.pluralizeCollections !== false);
    const exemptions = new Set([...(opt.exemptNames || []), ...((cfg.exemptNames)||[])]);
    const maxSuggestions = typeof opt.maxSuggestions === 'number' ? Math.max(1, Math.min(5, opt.maxSuggestions)) : 1;

    function suggest(node, messageId, data, suggestionText) {
      const rep = { node, messageId, data };
      if (suggestionText) {
        rep.suggest = [
          {
            messageId: 'suggestRename',
            data: { suggestion: suggestionText },
            fix(fixer) { return fixer.replaceText(node, suggestionText); }
          }
        ];
      }
      context.report(rep);
    }

    function checkStyle(idNode) {
      const name = idNode.name;
      if (exemptions.has(name)) return;
      const sugg = enforceStyle(name, style);
      if (sugg && maxSuggestions > 0) {
        suggest(idNode, 'wrongStyle', { name, style }, sugg);
      }
    }

    function checkBooleanPrefix(idNode, init) {
      if (!booleanPrefixes.length) return;
      const name = idNode.name;
      if (exemptions.has(name)) return;
      if (!init || init.type !== 'Literal' || typeof init.value !== 'boolean') return;
      const sugg = ensureBooleanPrefix(name, booleanPrefixes);
      if (sugg) {
        suggest(idNode, 'booleanPrefix', { name, prefixes: booleanPrefixes.join(', ') }, sugg);
      }
    }

    function checkAsyncFunction(idNode, funcNode) {
      if (!asyncPrefixes.length) return;
      if (!funcNode || funcNode.type !== 'FunctionDeclaration') return;
      if (!funcNode.async) return;
      if (!idNode) return;
      const name = idNode.name;
      if (exemptions.has(name)) return;
      const sugg = ensureAsyncPrefix(name, asyncPrefixes);
      if (sugg) {
        suggest(idNode, 'asyncPrefix', { name, prefixes: asyncPrefixes.join(', ') }, sugg);
      }
    }

    function checkPluralCollection(idNode, init) {
      if (!pluralizeFlag) return;
      const name = idNode.name;
      if (exemptions.has(name)) return;
      if (!isCollectionInit(init)) return;
      if (/(s|List|Set|Map)$/.test(name)) return; // looks plural/collection-like
      const sugg = pluralize(name);
      suggest(idNode, 'pluralCollection', { name }, sugg);
    }

    return {
      VariableDeclarator(node) {
        if (!node.id || node.id.type !== 'Identifier') return;
        const id = node.id;
        checkStyle(id);
        checkBooleanPrefix(id, node.init);
        checkPluralCollection(id, node.init);
      },
      FunctionDeclaration(node) {
        if (node.id) {
          checkStyle(node.id);
          checkAsyncFunction(node.id, node);
        }
      }
    };
  },
};