/**
 * @fileoverview Simplify boolean expressions and remove redundant logic
 * @author mojoatomic
 */
'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Checks if two nodes are equivalent
 */
function areNodesEquivalent(node1, node2, sourceCode) {
  if (!node1 || !node2) return false;
  return sourceCode.getText(node1) === sourceCode.getText(node2);
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Simplify boolean expressions and remove redundant logic',
      recommended: true,
      url: null,
    },
    fixable: 'code',
    schema: [],
    messages: {
      unnecessaryComparison: 'Unnecessary comparison with boolean literal. Use {{suggestion}} instead.',
      redundantExpression: 'Redundant expression. Simplify to {{suggestion}}.'
    },
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();

    return {
      BinaryExpression(node) {
        // x === true → x
        // x === false → !x
        if (node.operator === '===' || node.operator === '==') {
          if (node.right.type === 'Literal' && typeof node.right.value === 'boolean') {
            const value = node.right.value;
            context.report({
              node,
              messageId: 'unnecessaryComparison',
              data: {
                suggestion: value ? sourceCode.getText(node.left) : `!${sourceCode.getText(node.left)}`
              },
              fix(fixer) {
                if (value) {
                  return fixer.replaceText(node, sourceCode.getText(node.left));
                } else {
                  return fixer.replaceText(node, `!${sourceCode.getText(node.left)}`);
                }
              }
            });
          }
          if (node.left.type === 'Literal' && typeof node.left.value === 'boolean') {
            const value = node.left.value;
            context.report({
              node,
              messageId: 'unnecessaryComparison',
              data: {
                suggestion: value ? sourceCode.getText(node.right) : `!${sourceCode.getText(node.right)}`
              },
              fix(fixer) {
                if (value) {
                  return fixer.replaceText(node, sourceCode.getText(node.right));
                } else {
                  return fixer.replaceText(node, `!${sourceCode.getText(node.right)}`);
                }
              }
            });
          }
        }

        // x !== false → x
        // x !== true → !x
        if (node.operator === '!==' || node.operator === '!=') {
          if (node.right.type === 'Literal' && typeof node.right.value === 'boolean') {
            const value = node.right.value;
            context.report({
              node,
              messageId: 'unnecessaryComparison',
              data: {
                suggestion: value ? `!${sourceCode.getText(node.left)}` : sourceCode.getText(node.left)
              },
              fix(fixer) {
                if (value) {
                  return fixer.replaceText(node, `!${sourceCode.getText(node.left)}`);
                } else {
                  return fixer.replaceText(node, sourceCode.getText(node.left));
                }
              }
            });
          }
          if (node.left.type === 'Literal' && typeof node.left.value === 'boolean') {
            const value = node.left.value;
            context.report({
              node,
              messageId: 'unnecessaryComparison',
              data: {
                suggestion: value ? `!${sourceCode.getText(node.right)}` : sourceCode.getText(node.right)
              },
              fix(fixer) {
                if (value) {
                  return fixer.replaceText(node, `!${sourceCode.getText(node.right)}`);
                } else {
                  return fixer.replaceText(node, sourceCode.getText(node.right));
                }
              }
            });
          }
        }
      },

      LogicalExpression(node) {
        // x || x → x
        // x && x → x
        if (areNodesEquivalent(node.left, node.right, sourceCode)) {
          context.report({
            node,
            messageId: 'redundantExpression',
            data: {
              suggestion: sourceCode.getText(node.left)
            },
            fix(fixer) {
              return fixer.replaceText(node, sourceCode.getText(node.left));
            }
          });
        }

        // x && y || y → x || y (absorbing element)
        if (node.operator === '||' && 
            node.left.type === 'LogicalExpression' && 
            node.left.operator === '&&') {
          if (areNodesEquivalent(node.left.right, node.right, sourceCode)) {
            context.report({
              node,
              messageId: 'redundantExpression',
              data: {
                suggestion: `${sourceCode.getText(node.left.left)} || ${sourceCode.getText(node.right)}`
              },
              fix(fixer) {
                return fixer.replaceText(node, `${sourceCode.getText(node.left.left)} || ${sourceCode.getText(node.right)}`);
              }
            });
          }
          if (areNodesEquivalent(node.left.left, node.right, sourceCode)) {
            context.report({
              node,
              messageId: 'redundantExpression',
              data: {
                suggestion: `${sourceCode.getText(node.right)} || ${sourceCode.getText(node.left.right)}`
              },
              fix(fixer) {
                return fixer.replaceText(node, `${sourceCode.getText(node.right)} || ${sourceCode.getText(node.left.right)}`);
              }
            });
          }
        }
      }
    };
  },
};
