/**
 * @fileoverview Detect redundant calculations that should be computed at compile time
 * @author Doug
 */

'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/**
 * Evaluates a binary expression with literal operands
 * @param {ASTNode} node - The BinaryExpression node
 * @returns {number|null} - The evaluated result or null if cannot evaluate
 */
function evaluateExpression(node) {
  // Only evaluate if both sides are literals
  if (node.left.type !== 'Literal' || node.right.type !== 'Literal') {
    return null;
  }

  const left = node.left.value;
  const right = node.right.value;

  // Only evaluate numeric literals
  if (typeof left !== 'number' || typeof right !== 'number') {
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

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect redundant calculations that should be computed at compile time',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/yourusername/eslint-plugin-ai-code-snifftest/blob/main/docs/rules/no-redundant-calculations.md'
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowedOperators: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['+', '-', '*', '/', '%', '**']
            },
            uniqueItems: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      redundantCalculation: 'Calculate this at compile time: {{ result }}',
      complexCalculation: 'This calculation can be simplified to: {{ result }}'
    }
  },

  create(context) {
    const options = context.options[0] || {};
    const allowedOperators = options.allowedOperators || ['+', '-', '*', '/', '%', '**'];

    return {
      BinaryExpression(node) {
        // Skip if operator is not in allowed list
        if (!allowedOperators.includes(node.operator)) {
          return;
        }

        // Skip if not all operands are literals
        if (!isAllLiterals(node)) {
          return;
        }

        // Evaluate the expression
        const computedValue = evaluateTree(node);

        if (computedValue === null) {
          return;
        }

        // Report the issue
        context.report({
          node,
          messageId: node.type === 'BinaryExpression' && 
                     (node.left.type === 'BinaryExpression' || node.right.type === 'BinaryExpression')
            ? 'complexCalculation'
            : 'redundantCalculation',
          data: {
            result: String(computedValue)
          },
          fix(fixer) {
            // Replace the entire expression with the calculated value
            return fixer.replaceText(node, String(computedValue));
          }
        });
      }
    };
  }
};
