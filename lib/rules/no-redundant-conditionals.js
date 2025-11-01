/**
 * @fileoverview Simplify redundant conditional expressions
 * @author mojoatomic
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: "Simplify redundant conditional expressions",
      recommended: true,
      url: 'https://github.com/mojoatomic/eslint-plugin-ai-code-snifftest/blob/main/docs/rules/no-redundant-conditionals.md',
    },
    fixable: 'code',
    schema: [],
    messages: {
      constantCondition: 'Condition is always {{value}}. {{fix}}',
      redundantBoolean: 'Redundant boolean comparison: {{original}}',
      redundantTernary: 'Redundant ternary expression can be simplified',
      redundantLogical: 'Redundant logical expression: {{original}}',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;

    //----------------------------------------------------------------------
    // Helpers
    //----------------------------------------------------------------------

    /**
     * Check if a node is a constant literal value
     */
    function isConstant(node) {
      if (node.type === 'Literal') {
        return true;
      }
      
      if (node.type === 'Identifier' && (node.name === 'undefined' || node.name === 'NaN')) {
        return true;
      }
      
      // Unary expressions with constant operands (-1, +5, etc)
      if (node.type === 'UnaryExpression' && isConstant(node.argument)) {
        return true;
      }

      // Binary expressions with constant operands
      if (node.type === 'BinaryExpression' && isConstant(node.left) && isConstant(node.right)) {
        // Only treat as constant if we can evaluate safely
        const val = evaluateConstant(node);
        return val !== null;
      }
      
      // Object and array literals are always truthy
      if (node.type === 'ObjectExpression' || node.type === 'ArrayExpression') {
        return true;
      }
      
      return false;
    }

    /**
     * Get the boolean value of a constant
     */
    function getBooleanValue(node) {
      if (node.type === 'Literal') {
        return Boolean(node.value);
      }
      
      if (node.type === 'Identifier') {
        if (node.name === 'undefined' || node.name === 'NaN') return false;
      }
      
      // Unary expressions: evaluate recursively
      if (node.type === 'UnaryExpression') {
        const argValue = getBooleanValue(node.argument);
        if (argValue !== null) {
          if (node.operator === '-') {
            // -0 is falsy, any other negative number is truthy
            const literalValue = node.argument.type === 'Literal' ? node.argument.value : null;
            return literalValue === 0 ? false : argValue;
          }
          if (node.operator === '+') {
            return argValue;
          }
          if (node.operator === '!') {
            return !argValue;
          }
        }
        return null;
      }

      // Binary expressions with constant operands
      if (node.type === 'BinaryExpression') {
        const val = evaluateConstant(node);
        if (val === null) return null;
        return Boolean(val);
      }
      
      // Object and array literals are always truthy
      if (node.type === 'ObjectExpression' || node.type === 'ArrayExpression') {
        return true;
      }
      
      return null;
    }

    /**
     * Check if expression compares value === true or value !== false
     */
    function isRedundantBooleanComparison(node) {
      if (node.type !== 'BinaryExpression') return null;

      const { operator, left, right } = node;
      
      // Check for x === true, x == true, x !== false, x != false
      if ((operator === '===' || operator === '==') && 
          right.type === 'Literal' && right.value === true) {
        return { node: left, negated: false, strict: operator === '===' };
      }
      
      if ((operator === '===' || operator === '==') && 
          left.type === 'Literal' && left.value === true) {
        return { node: right, negated: false, strict: operator === '===' };
      }

      if ((operator === '!==' || operator === '!=') && 
          right.type === 'Literal' && right.value === false) {
        return { node: left, negated: false, strict: operator === '!==' };
      }
      
      if ((operator === '!==' || operator === '!=') && 
          left.type === 'Literal' && left.value === false) {
        return { node: right, negated: false, strict: operator === '!==' };
      }

      // Check for x === false, x !== true (should be negated)
      if ((operator === '===' || operator === '==') && 
          right.type === 'Literal' && right.value === false) {
        return { node: left, negated: true, strict: operator === '===' };
      }
      
      if ((operator === '===' || operator === '==') && 
          left.type === 'Literal' && left.value === false) {
        return { node: right, negated: true, strict: operator === '===' };
      }

      if ((operator === '!==' || operator === '!=') && 
          right.type === 'Literal' && right.value === true) {
        return { node: left, negated: true, strict: operator === '!==' };
      }
      
      if ((operator === '!==' || operator === '!=') && 
          left.type === 'Literal' && left.value === true) {
        return { node: right, negated: true, strict: operator === '!==' };
      }

      return null;
    }

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    // Simplify logical expressions in conditions when safe
    // Evaluate constant value of an expression, or null if unknown
    function evaluateConstant(node) {
      if (node.type === 'Literal') return node.value;
      if (node.type === 'Identifier') {
        if (node.name === 'undefined') return undefined;
        if (node.name === 'NaN') return NaN;
        return null;
      }
      if (node.type === 'UnaryExpression') {
        const v = evaluateConstant(node.argument);
        if (v === null) return null;
        switch (node.operator) {
          case '-': return typeof v === 'number' ? -v : null;
          case '+': return typeof v === 'number' ? +v : null;
          case '!': return !v;
          default: return null;
        }
      }
      if (node.type === 'BinaryExpression') {
        const l = evaluateConstant(node.left);
        const r = evaluateConstant(node.right);
        if (l === null || r === null) return null;
        switch (node.operator) {
          case '+':
            if (typeof l === 'number' && typeof r === 'number') return l + r;
            if (typeof l === 'string' || typeof r === 'string') return String(l) + String(r);
            return null;
          case '-': case '*': case '/': case '%': case '**':
            if (typeof l === 'number' && typeof r === 'number') return evalNumberOp(node.operator, l, r);
            return null;
          case '<': case '>': case '<=': case '>=':
            if (typeof l === 'number' && typeof r === 'number') return evalRelOp(node.operator, l, r);
            return null;
          case '===': return l === r;
          case '!==': return l !== r;
          default: return null;
        }
      }
      return null;
    }

    function evalNumberOp(op, l, r) {
      switch (op) {
        case '-': return l - r;
        case '*': return l * r;
        case '/': return l / r;
        case '%': return l % r;
        case '**': return l ** r;
        default: return NaN;
      }
    }

    function evalRelOp(op, l, r) {
      switch (op) {
        case '<': return l < r;
        case '>': return l > r;
        case '<=': return l <= r;
        case '>=': return l >= r;
        default: return false;
      }
    }

    function simplifyLogicalExpression(test, node) {
      if (test.type !== 'LogicalExpression') return null;
      const leftVal = getBooleanValue(test.left);
      const rightVal = getBooleanValue(test.right);
      const op = test.operator;
      const leftText = sourceCode.getText(test.left);
      const rightText = sourceCode.getText(test.right);

      // Helper to build constant-condition style fix
      function constantFix(value) {
        return function(fixer) {
          if (value === true) {
            if (node.consequent.type === 'BlockStatement') {
              const bodyText = sourceCode.getText(node.consequent).slice(1, -1).trim();
              return fixer.replaceText(node, bodyText);
            }
            return fixer.replaceText(node, sourceCode.getText(node.consequent));
          }
          if (node.alternate) {
            if (node.alternate.type === 'BlockStatement') {
              const altText = sourceCode.getText(node.alternate).slice(1, -1).trim();
              return fixer.replaceText(node, altText);
            }
            return fixer.replaceText(node, sourceCode.getText(node.alternate));
          }
          return fixer.remove(node);
        };
      }

      // Evaluate simplifications
      if (op === '&&') {
        if (leftVal === false || rightVal === false) {
          return { kind: 'constant', value: false, fix: constantFix(false) };
        }
        if (leftVal === true) {
          return { kind: 'expr', text: rightText };
        }
        if (rightVal === true) {
          return { kind: 'expr', text: leftText };
        }
      }
      if (op === '||') {
        if (leftVal === true || rightVal === true) {
          return { kind: 'constant', value: true, fix: constantFix(true) };
        }
        if (leftVal === false) {
          return { kind: 'expr', text: rightText };
        }
        if (rightVal === false) {
          return { kind: 'expr', text: leftText };
        }
      }
      return null;
    }

    return {
      IfStatement(node) {
        const { test } = node;

        // Check for constant condition
        if (isConstant(test)) {
          const value = getBooleanValue(test);
          const valueStr = String(value);
          
          context.report({
            node: test,
            messageId: 'constantCondition',
            data: {
              value: valueStr,
              fix: value ? 'Remove the conditional' : 'This code is unreachable'
            },
            fix(fixer) {
              if (value === true) {
                // if (true) { A } else { B } → A (drop else)
                if (node.consequent.type === 'BlockStatement') {
                  const bodyText = sourceCode.getText(node.consequent).slice(1, -1).trim();
                  return fixer.replaceText(node, bodyText);
                }
                return fixer.replaceText(node, sourceCode.getText(node.consequent));
              }
              // value === false
              // if (false) { A } else { B } → B; if no else, remove
              if (node.alternate) {
                if (node.alternate.type === 'BlockStatement') {
                  const altText = sourceCode.getText(node.alternate).slice(1, -1).trim();
                  return fixer.replaceText(node, altText);
                }
                return fixer.replaceText(node, sourceCode.getText(node.alternate));
              }
              return fixer.remove(node);
            },
          });
        }

        // Check for redundant boolean comparison
        const boolCheck = isRedundantBooleanComparison(test);
        if (boolCheck) {
          const original = sourceCode.getText(test);
          const simplified = boolCheck.negated 
            ? `!${sourceCode.getText(boolCheck.node)}`
            : sourceCode.getText(boolCheck.node);

          context.report({
            node: test,
            messageId: 'redundantBoolean',
            data: { original },
            fix(fixer) {
              return fixer.replaceText(test, simplified);
            },
          });
        }

        // Logical expression simplification (short-circuit)
        if (test.type === 'LogicalExpression') {
          const simp = simplifyLogicalExpression(test, node);
          if (simp) {
            if (simp.kind === 'expr') {
              const original = sourceCode.getText(test);
              context.report({
                node: test,
                messageId: 'redundantLogical',
                data: { original },
                fix(fixer) {
                  return fixer.replaceText(test, simp.text);
                }
              });
            } else if (simp.kind === 'constant') {
              // Report as constant condition and fix whole statement safely
              context.report({
                node: test,
                messageId: 'constantCondition',
                data: { value: String(simp.value), fix: simp.value ? 'Remove the conditional' : 'This code is unreachable' },
                fix: simp.fix,
              });
            }
          }
        }
      },

      // Loop statements
      WhileStatement(node) {
        const { test } = node;
        if (isConstant(test)) {
          const value = getBooleanValue(test);
          const valueStr = String(value);
          context.report({
            node: test,
            messageId: 'constantCondition',
            data: {
              value: valueStr,
              fix: value ? 'Potential infinite loop' : 'This loop is unreachable'
            },
            fix(fixer) {
              if (value === false) {
                return fixer.remove(node);
              }
              // Do not auto-fix while (true)
              return null;
            }
          });
        }
      },

      DoWhileStatement(node) {
        const { test } = node;
        if (isConstant(test)) {
          const value = getBooleanValue(test);
          const valueStr = String(value);
          context.report({
            node: test,
            messageId: 'constantCondition',
            data: {
              value: valueStr,
              fix: value ? 'Potential infinite loop' : 'Simplify: body runs once'
            },
            fix(fixer) {
              if (value === false) {
                // do { ... } while (false); → body
                if (node.body && node.body.type === 'BlockStatement') {
                  const bodyText = sourceCode.getText(node.body).slice(1, -1).trim();
                  return fixer.replaceText(node, bodyText);
                }
                // Non-block body: skip auto-fix for safety
                return null;
              }
              return null;
            }
          });
        }
      },

      ForStatement(node) {
        const { test } = node;
        // for (;;) has null test → treated as true
        if (test === null || isConstant(test)) {
          const value = test === null ? true : getBooleanValue(test);
          const valueStr = String(value);
          context.report({
            node: test || node,
            messageId: 'constantCondition',
            data: {
              value: valueStr,
              fix: value ? 'Potential infinite loop' : 'This loop is unreachable'
            },
            fix(fixer) {
              if (value === false) {
                return fixer.remove(node);
              }
              return null;
            }
          });
        }
      },

      ConditionalExpression(node) {
        const { test, consequent, alternate } = node;

        // Check for x ? true : false
        if (consequent.type === 'Literal' && consequent.value === true &&
            alternate.type === 'Literal' && alternate.value === false) {
          context.report({
            node,
            messageId: 'redundantTernary',
            fix(fixer) {
              return fixer.replaceText(node, `Boolean(${sourceCode.getText(test)})`);
            },
          });
        }

        // Check for x ? false : true
        if (consequent.type === 'Literal' && consequent.value === false &&
            alternate.type === 'Literal' && alternate.value === true) {
          context.report({
            node,
            messageId: 'redundantTernary',
            fix(fixer) {
              return fixer.replaceText(node, `!${sourceCode.getText(test)}`);
            },
          });
        }

        // Check for x ? value : value (identical branches)
        const consequentText = sourceCode.getText(consequent);
        const alternateText = sourceCode.getText(alternate);
        if (consequentText === alternateText) {
          context.report({
            node,
            messageId: 'redundantTernary',
            fix(fixer) {
              return fixer.replaceText(node, consequentText);
            },
          });
        }
      },
    };
  },
};
