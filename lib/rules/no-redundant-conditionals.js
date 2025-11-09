/**
 * @fileoverview Simplify redundant conditional expressions
 * @author mojoatomic
 */
'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Simplify redundant conditional expressions',
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
      redundantSwitch: 'Switch with constant discriminant can be simplified',
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
      const isBoolLit = (n) => n.type === 'Literal' && typeof n.value === 'boolean';
      const strict = operator === '===' || operator === '!==' ;
      const isEq = operator === '===' || operator === '==';
      const isNe = operator === '!==' || operator === '!=';

      // Helper to build result consistently
      function res(target, neg) { return { node: target, negated: neg, strict }; }

      // Pattern matrix (check right then left to stay symmetric)
      if (isEq && isBoolLit(right) && right.value === true) return res(left, false);
      if (isEq && isBoolLit(left) && left.value === true) return res(right, false);

      if (isNe && isBoolLit(right) && right.value === false) return res(left, false);
      if (isNe && isBoolLit(left) && left.value === false) return res(right, false);

      if (isEq && isBoolLit(right) && right.value === false) return res(left, true);
      if (isEq && isBoolLit(left) && left.value === false) return res(right, true);

      if (isNe && isBoolLit(right) && right.value === true) return res(left, true);
      if (isNe && isBoolLit(left) && left.value === true) return res(right, true);

      return null;
    }

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    // Simplify logical expressions in conditions when safe
    // Evaluate constant value of an expression, or null if unknown
    function evalUnaryOp(op, v) {
      if (v === null) return null;
      if (op === '-') return typeof v === 'number' ? -v : null;
      if (op === '+') return typeof v === 'number' ? +v : null;
      if (op === '!') return !v;
      return null;
    }

    function evalNumberOp(op, l, r) {
      if (op === '-') return l - r;
      if (op === '*') return l * r;
      if (op === '/') return l / r;
      if (op === '%') return l % r;
      if (op === '**') return l ** r;
      return NaN;
    }

    function evalRelOp(op, l, r) {
      if (op === '<') return l < r;
      if (op === '>') return l > r;
      if (op === '<=') return l <= r;
      if (op === '>=') return l >= r;
      return false;
    }

    function evalBinaryOp(op, l, r) {
      if (l === null || r === null) return null;
      if (op === '+') {
        if (typeof l === 'number' && typeof r === 'number') return l + r;
        if (typeof l === 'string' || typeof r === 'string') return String(l) + String(r);
        return null;
      }
      if (op === '-' || op === '*' || op === '/' || op === '%' || op === '**') {
        if (typeof l === 'number' && typeof r === 'number') return evalNumberOp(op, l, r);
        return null;
      }
      if (op === '<' || op === '>' || op === '<=' || op === '>=') {
        if (typeof l === 'number' && typeof r === 'number') return evalRelOp(op, l, r);
        return null;
      }
      if (op === '===') return l === r;
      if (op === '!==') return l !== r;
      return null;
    }

    function evaluateConstant(node) {
      if (node.type === 'Literal') return node.value;
      if (node.type === 'Identifier') {
        if (node.name === 'undefined') return undefined;
        if (node.name === 'NaN') return NaN;
        return null;
      }
      if (node.type === 'UnaryExpression') {
        const v = evaluateConstant(node.argument);
        return evalUnaryOp(node.operator, v);
      }
      if (node.type === 'BinaryExpression') {
        const l = evaluateConstant(node.left);
        const r = evaluateConstant(node.right);
        return evalBinaryOp(node.operator, l, r);
      }
      return null;
    }

    function triBool(node) {
      const raw = getBooleanValue(node);
      if (node.type === 'Identifier' && node.name !== 'undefined' && node.name !== 'NaN') return null;
      return raw;
    }

    function constantFixBuilder(sourceCode, node, value) {
      return function(fixer) {
        if (value) {
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

    function simplifyLogicalExpression(test, node) {
      if (test.type !== 'LogicalExpression') return null;
      const leftVal = triBool(test.left);
      const rightVal = triBool(test.right);
      const op = test.operator;
      const leftText = sourceCode.getText(test.left);
      const rightText = sourceCode.getText(test.right);

      if (op === '&&') {
        if (leftVal === false || rightVal === false) {
          return { kind: 'constant', value: false, fix: constantFixBuilder(sourceCode, node, false) };
        }
        if (leftVal === true && rightVal === null) return { kind: 'expr', text: rightText };
        if (rightVal === true && leftVal === null) return { kind: 'expr', text: leftText };
      }
      if (op === '||') {
        if (leftVal === true || rightVal === true) {
          return { kind: 'constant', value: true, fix: constantFixBuilder(sourceCode, node, true) };
        }
        if (leftVal === false && rightVal === null) return { kind: 'expr', text: rightText };
        if (rightVal === false && leftVal === null) return { kind: 'expr', text: leftText };
      }
      return null;
    }

    return {
      IfStatement(node) {
        const { test } = node;

        // Check for constant condition
        if (isConstant(test)) {
          const boolValue = getBooleanValue(test);
          const boolValueStr = String(boolValue);
          
          context.report({
            node: test,
            messageId: 'constantCondition',
            data: {
              value: boolValueStr,
              fix: boolValue ? 'Remove the conditional' : 'This code is unreachable'
            },
            fix(fixer) {
              if (boolValue) {
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
          return; // avoid double-reporting on the same test
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
          const boolValue = getBooleanValue(test);
          const boolValueStr = String(boolValue);
          context.report({
            node: test,
            messageId: 'constantCondition',
            data: {
              value: boolValueStr,
              fix: boolValue ? 'Potential infinite loop' : 'This loop is unreachable'
            },
            fix(fixer) {
              if (!boolValue) {
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
          const boolValue = getBooleanValue(test);
          const boolValueStr = String(boolValue);
          context.report({
            node: test,
            messageId: 'constantCondition',
            data: {
              value: boolValueStr,
              fix: boolValue ? 'Potential infinite loop' : 'Simplify: body runs once'
            },
            fix(fixer) {
              if (!boolValue) {
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
          const boolValue = test === null ? true : getBooleanValue(test);
          const boolValueStr = String(boolValue);
          context.report({
            node: test || node,
            messageId: 'constantCondition',
            data: {
              value: boolValueStr,
              fix: boolValue ? 'Potential infinite loop' : 'This loop is unreachable'
            },
            fix(fixer) {
              if (!boolValue) {
                return fixer.remove(node);
              }
              return null;
            }
          });
        }
      },

      SwitchStatement(node) {
        // Only proceed if discriminant is constant
        const discVal = evaluateConstant(node.discriminant);
        if (discVal === null) return;

        // Find matching case (using strict equality semantics)
        let matchingIndex = -1;
        for (let i = 0; i < node.cases.length; i++) {
          const c = node.cases[i];
          if (c.test === null) {
            continue; // default, handle later if no match
          }
          const testVal = evaluateConstant(c.test);
          if (testVal !== null && testVal === discVal) {
            matchingIndex = i;
            break;
          }
        }

        const hasDefault = node.cases.some(c => c.test === null);
        const defaultIndex = node.cases.findIndex(c => c.test === null);

        function isSafeCase(caseNode, isLastCase) {
          const cons = caseNode.consequent || [];
          if (cons.length === 0) return false; // empty → fallthrough
          const lastStmt = cons[cons.length - 1];
          // safe if ends in break/return/throw/continue OR it's last case and ends execution
          if (lastStmt.type === 'BreakStatement' || lastStmt.type === 'ReturnStatement' || lastStmt.type === 'ThrowStatement' || lastStmt.type === 'ContinueStatement') {
            return true;
          }
          // If it's the last case, we allow no break (no fallthrough)
          return isLastCase;
        }

        function buildBodyText(caseNode) {
          const parts = [];
          for (const stmt of caseNode.consequent) {
            if (stmt.type === 'BreakStatement') continue;
            parts.push(sourceCode.getText(stmt));
          }
          return parts.join('\n');
        }

        // Report and possibly fix
        if (matchingIndex >= 0) {
          const caseNode = node.cases[matchingIndex];
          const isLast = matchingIndex === node.cases.length - 1;
          const safe = isSafeCase(caseNode, isLast);
          if (safe) {
            const bodyText = buildBodyText(caseNode);
            context.report({
              node,
              messageId: 'redundantSwitch',
              fix(fixer) {
                return fixer.replaceText(node, bodyText);
              }
            });
          } else {
            context.report({ node, messageId: 'redundantSwitch' });
          }
          return;
        }

        // No matching case
        if (hasDefault) {
          const caseNode = node.cases[defaultIndex];
          const isLast = defaultIndex === node.cases.length - 1;
          const safe = isSafeCase(caseNode, isLast);
          if (safe) {
            const bodyText = buildBodyText(caseNode);
            context.report({
              node,
              messageId: 'redundantSwitch',
              fix(fixer) {
                return fixer.replaceText(node, bodyText);
              }
            });
          } else {
            context.report({ node, messageId: 'redundantSwitch' });
          }
        } else {
          // No matching and no default → no-op switch
          context.report({
            node,
            messageId: 'redundantSwitch',
            fix(fixer) {
              return fixer.remove(node);
            }
          });
        }
      },

      ConditionalExpression(node) {
        const { test, consequent, alternate } = node;

        // Check for x ? true : false (boolean literals only)
        if (
          consequent.type === 'Literal' && typeof consequent.value === 'boolean' && consequent.value &&
          alternate.type === 'Literal' && typeof alternate.value === 'boolean' && !alternate.value
        ) {
          context.report({
            node,
            messageId: 'redundantTernary',
            fix(fixer) {
              return fixer.replaceText(node, `Boolean(${sourceCode.getText(test)})`);
            },
          });
        }

        // Check for x ? false : true (boolean literals only)
        if (
          consequent.type === 'Literal' && typeof consequent.value === 'boolean' && !consequent.value &&
          alternate.type === 'Literal' && typeof alternate.value === 'boolean' && alternate.value
        ) {
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
