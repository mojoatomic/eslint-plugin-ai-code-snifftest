/**
 * @fileoverview Flag generic names; encourage domain-specific naming via project config
 */
"use strict";

const { readProjectConfig } = require('../utils/project-config');
const { hasScientificTerm, getDomainForName } = require('../constants');

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Flag generic names; enforce domain-specific naming',
      recommended: false,
      url: null,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          forbiddenNames: { type: 'array', items: { type: 'string' } },
          forbiddenTerms: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      }
    ],
    messages: {
      genericName: 'Generic name "{{name}}" - use a domain-specific term',
      forbiddenTerm: 'Identifier contains forbidden term "{{term}}"; choose a domain-appropriate name',
    },
  },

  create(context) {
    const project = readProjectConfig(context) || {};
    const opt = (context.options && context.options[0]) || {};
    const forbiddenNames = new Set([...(project.antiPatterns?.forbiddenNames || []), ...(opt.forbiddenNames || [])].map(String));
    const forbiddenTerms = [...(project.antiPatterns?.forbiddenTerms || []), ...(opt.forbiddenTerms || [])].map(String);

    function checkIdentifier(idNode) {
      if (!idNode || idNode.type !== 'Identifier') return;
      const name = idNode.name || '';
      if (!name) return;

      // Skip when identifier already includes a recognized domain term (avoid penalizing domain-rich names)
      if (hasScientificTerm(name) || getDomainForName(name)) {
        return;
      }
      // Exact forbidden name
      if (forbiddenNames.has(name)) {
        context.report({ node: idNode, messageId: 'genericName', data: { name } });
        return;
      }
      // Contains forbidden term (case-insensitive)
      const lname = name.toLowerCase();
      for (const term of forbiddenTerms) {
        if (!term) continue;
        if (lname.includes(String(term).toLowerCase())) {
          context.report({ node: idNode, messageId: 'forbiddenTerm', data: { term } });
          return;
        }
      }
    }

    return {
      VariableDeclarator(node) {
        if (node.id && node.id.type === 'Identifier') checkIdentifier(node.id);
      },
      FunctionDeclaration(node) {
        if (node.id) checkIdentifier(node.id);
      },
      ClassDeclaration(node) {
        if (node.id) checkIdentifier(node.id);
      },
      // Assignments to identifiers (e.g., foo = ...)
      AssignmentExpression(node) {
        if (node.left && node.left.type === 'Identifier') checkIdentifier(node.left);
      },
      // Catch parameter
      CatchClause(node) {
        if (node.param && node.param.type === 'Identifier') checkIdentifier(node.param);
      }
    };
  },
};