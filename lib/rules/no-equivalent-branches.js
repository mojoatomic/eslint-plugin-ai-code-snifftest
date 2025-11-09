/**
 * @fileoverview Detect if/else branches that do the same thing
 * @author mojoatomic
 */
'use strict';

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Compares two AST nodes for structural equality
 * @param {ASTNode} node1 - First node to compare
 * @param {ASTNode} node2 - Second node to compare
 * @returns {boolean} - True if nodes are structurally equivalent
 */
const _comparators = {
  Literal(a, b) { return a.value === b.value; },
  Identifier(a, b) { return a.name === b.name; },
  MemberExpression(a, b) {
    return areNodesEquivalent(a.object, b.object) &&
      areNodesEquivalent(a.property, b.property) &&
      a.computed === b.computed;
  },
  CallExpression(a, b) {
    return areNodesEquivalent(a.callee, b.callee) &&
      a.arguments.length === b.arguments.length &&
      a.arguments.every((arg, i) => areNodesEquivalent(arg, b.arguments[i]));
  },
  BinaryExpression(a, b) {
    return a.operator === b.operator && areNodesEquivalent(a.left, b.left) && areNodesEquivalent(a.right, b.right);
  },
  LogicalExpression(a, b) {
    return _comparators.BinaryExpression(a, b);
  },
  UnaryExpression(a, b) {
    return a.operator === b.operator && areNodesEquivalent(a.argument, b.argument);
  },
  ReturnStatement(a, b) { return areNodesEquivalent(a.argument, b.argument); },
  ExpressionStatement(a, b) { return areNodesEquivalent(a.expression, b.expression); },
  AssignmentExpression(a, b) {
    return a.operator === b.operator && areNodesEquivalent(a.left, b.left) && areNodesEquivalent(a.right, b.right);
  },
  VariableDeclaration(a, b) {
    return a.kind === b.kind && a.declarations.length === b.declarations.length &&
      a.declarations.every((decl, i) => areNodesEquivalent(decl, b.declarations[i]));
  },
  VariableDeclarator(a, b) {
    return areNodesEquivalent(a.id, b.id) && areNodesEquivalent(a.init, b.init);
  },
  BlockStatement(a, b) {
    return a.body.length === b.body.length && a.body.every((stmt, i) => areNodesEquivalent(stmt, b.body[i]));
  }
};

function areNodesEquivalent(node1, node2) {
  if (!node1 || !node2) return node1 === node2;
  if (node1.type !== node2.type) return false;
  const cmp = _comparators[node1.type];
  if (!cmp) return false;
  return cmp(node1, node2);
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect if/else branches that do the same thing',
      recommended: true,
      url: null,
    },
    fixable: 'code',
    schema: [],
    messages: {
      equivalentBranches: 'Both branches of this conditional do the same thing. Remove the conditional.',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();

    return {
      IfStatement(node) {
        // Only check if there's an else branch
        if (!node.alternate) {
          return;
        }

        // Skip if alternate is another IfStatement (else if)
        if (node.alternate.type === 'IfStatement') {
          return;
        }

        // Compare consequent and alternate
        if (areNodesEquivalent(node.consequent, node.alternate)) {
          context.report({
            node,
            messageId: 'equivalentBranches',
            fix(fixer) {
              // Remove the conditional, keep just the consequent block content
              const consequent = node.consequent;
              
              if (consequent.type === 'BlockStatement') {
                // Extract block content without braces
                const blockContent = sourceCode.getText(consequent).slice(2, -2).trim();
                return fixer.replaceText(node, blockContent || ';');
              } else {
                // Single statement
                return fixer.replaceText(node, sourceCode.getText(consequent));
              }
            }
          });
        }
      }
    };
  },
};
