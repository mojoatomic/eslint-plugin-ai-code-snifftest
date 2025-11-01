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
                // if (true) { body } → body
                if (node.consequent.type === 'BlockStatement') {
                  const bodyText = sourceCode.getText(node.consequent).slice(1, -1).trim();
                  return fixer.replaceText(node, bodyText);
                }
                return fixer.replaceText(node, sourceCode.getText(node.consequent));
              }
              // if (false) - remove entire statement
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
