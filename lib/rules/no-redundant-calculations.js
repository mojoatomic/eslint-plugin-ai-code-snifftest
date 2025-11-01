/**
 * @fileoverview Detect redundant calculations that should be computed at compile time
 * @author mojoatomic
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Checks if an expression tree contains only literals
 * @param {ASTNode} node - The expression node
 * @returns {boolean} - True if all operands are literals
 */
function isAllLiterals(node) {
  if (node.type === 'Literal') {
    return true;
  }

  if (node.type === 'BinaryExpression') {
    return isAllLiterals(node.left) && isAllLiterals(node.right);
  }

  return false;
}

/**
 * Recursively evaluates a binary expression tree
 * @param {ASTNode} node - The expression node
 * @returns {number|null} - The evaluated result
 */
function evaluateTree(node) {
  if (node.type === 'Literal') {
    return node.value;
  }

  if (node.type === 'BinaryExpression') {
    const left = evaluateTree(node.left);
    const right = evaluateTree(node.right);

    if (left === null || right === null) {
      return null;
    }

    switch (node.operator) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        return left / right;
      case '%':
        return left % right;
      case '**':
        return left ** right;
      default:
        return null;
    }
  }

  return null;
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: "Detect redundant calculations that should be computed at compile time",
      recommended: true,
      url: null,
    },
    fixable: 'code',
    schema: [],
    messages: {
      redundantCalculation: 'Calculate this at compile time: {{ result }}'
    },
  },

  create(context) {
    return {
      BinaryExpression(node) {
        // Skip if not all operands are literals
        if (!isAllLiterals(node)) {
          return;
        }

        // Skip if parent is also a BinaryExpression with all literals
        // (we want to report the outermost expression only)
        if (node.parent && node.parent.type === 'BinaryExpression' && isAllLiterals(node.parent)) {
          return;
        }

        // Only handle numeric calculations
        const result = evaluateTree(node);

        if (result === null || typeof result !== 'number') {
          return;
        }

        // Report the issue
        context.report({
          node,
          messageId: 'redundantCalculation',
          data: {
            result: String(result)
          },
          fix(fixer) {
            return fixer.replaceText(node, String(result));
          }
        });
      }
    };
  },
};
