/**
 * @fileoverview Suggest inlining trivial single-use wrapper functions that add no value
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
      description: "Suggest inlining trivial single-use wrapper functions that add no value",
      recommended: false,
      url: 'https://github.com/mojoatomic/eslint-plugin-ai-code-snifftest/blob/main/docs/rules/no-unnecessary-abstraction.md',
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      unnecessaryWrapper: 'Function \'{{name}}\' is a trivial wrapper that only calls \'{{wrappedName}}\'. Consider inlining it.',
      inlineFunction: 'Inline the wrapper function',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;
    const functionReferences = new Map();
    const functionsUsedAsObjects = new Set();

    //----------------------------------------------------------------------
    // Helpers
    //----------------------------------------------------------------------

    /**
     * Check if a function is a trivial wrapper (only returns a single function call)
     * @param {Object} node - Function node
     * @returns {Object|null} - Wrapped call info or null
     */
    function getTrivialWrapperInfo(node) {
      const body = node.body;

      // Must be a block statement with exactly one return statement
      if (!body || body.type !== 'BlockStatement' || body.body.length !== 1) {
        return null;
      }

      const statement = body.body[0];
      if (statement.type !== 'ReturnStatement' || !statement.argument) {
        return null;
      }

      const returnValue = statement.argument;

      // Must return a call expression
      if (returnValue.type !== 'CallExpression') {
        return null;
      }

      // Get the wrapped function name (only support simple identifiers)
      if (returnValue.callee.type !== 'Identifier') {
        return null;
      }
      
      const wrappedName = returnValue.callee.name;

      // Check if arguments are simply passed through
      const wrapperParams = node.params;
      const callArgs = returnValue.arguments;

      // Must have same number of arguments
      if (wrapperParams.length !== callArgs.length) {
        return null;
      }

      // Each argument must match the corresponding parameter
      for (let i = 0; i < wrapperParams.length; i++) {
        const param = wrapperParams[i];
        const arg = callArgs[i];

        // Only support simple identifier parameters
        if (param.type !== 'Identifier') {
          return null;
        }

        // Argument must be an identifier with the same name
        if (arg.type !== 'Identifier' || arg.name !== param.name) {
          return null;
        }
      }

      return {
        wrappedName,
        callNode: returnValue,
      };
    }

    /**
     * Track function references
     */
    function trackFunction(node) {
      let name = null;

      if (node.type === 'FunctionDeclaration' && node.id) {
        name = node.id.name;
      } else if (node.parent.type === 'VariableDeclarator' && node.parent.id.type === 'Identifier') {
        name = node.parent.id.name;
      }

      if (name) {
        if (!functionReferences.has(name)) {
          functionReferences.set(name, { node, callCount: 0 });
        }
      }
    }

    /**
     * Count function call references
     */
    function countReference(node) {
      if (node.callee.type === 'Identifier') {
        const name = node.callee.name;
        const ref = functionReferences.get(name);
        if (ref) {
          ref.callCount++;
        }
      }
    }

    /**
     * Track when functions are used as objects (property access, not just calls)
     */
    function trackMemberExpression(node) {
      if (node.object.type === 'Identifier') {
        functionsUsedAsObjects.add(node.object.name);
      }
    }

    /**
     * Track when functions are passed as values (not called)
     */
    function trackIdentifierUsage(node) {
      // Skip if it's a function declaration
      if (node.parent.type === 'FunctionDeclaration') {
        return;
      }

      // Skip if it's a call expression callee
      if (node.parent.type === 'CallExpression' && node.parent.callee === node) {
        return;
      }

      // Skip if it's a variable declarator id
      if (node.parent.type === 'VariableDeclarator' && node.parent.id === node) {
        return;
      }

      // Skip if it's a function parameter
      if (node.parent.type === 'FunctionDeclaration' ||
          node.parent.type === 'FunctionExpression' ||
          node.parent.type === 'ArrowFunctionExpression') {
        return;
      }

      // Track functions used as values (callbacks, property assignments, etc)
      if (functionReferences.has(node.name)) {
        functionsUsedAsObjects.add(node.name);
      }
    }

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    return {
      FunctionDeclaration: trackFunction,
      FunctionExpression: trackFunction,
      ArrowFunctionExpression: trackFunction,
      CallExpression: countReference,
      MemberExpression: trackMemberExpression,
      Identifier: trackIdentifierUsage,

      'Program:exit'() {
        // Check each function to see if it's a trivial wrapper used only once
        for (const [name, { node, callCount }] of functionReferences) {
          // Only report if called exactly once
          if (callCount !== 1) {
            continue;
          }

          const wrapperInfo = getTrivialWrapperInfo(node);
          if (!wrapperInfo) {
            continue;
          }

          // Skip exported functions (they are public API)
          if (node.parent.type === 'ExportNamedDeclaration' || 
              node.parent.type === 'ExportDefaultDeclaration') {
            continue;
          }

          // Skip functions exported via variable declaration
          if (node.parent.type === 'VariableDeclarator' &&
              node.parent.parent.parent &&
              node.parent.parent.parent.type === 'ExportNamedDeclaration') {
            continue;
          }

          // Skip functions used as objects (property access, passed as callbacks, etc)
          if (functionsUsedAsObjects.has(name)) {
            continue;
          }

          // For function expressions/arrows in variable declarations, remove the entire declaration
          let functionNode;
          if (node.parent.type === 'VariableDeclarator') {
            // node.parent = VariableDeclarator
            // node.parent.parent = VariableDeclaration
            functionNode = node.parent.parent;
          } else {
            // FunctionDeclaration
            functionNode = node;
          }

          context.report({
            node: functionNode,
            messageId: 'unnecessaryWrapper',
            data: {
              name,
              wrappedName: wrapperInfo.wrappedName,
            },
            suggest: [
              {
                messageId: 'inlineFunction',
                fix(fixer) {
                  //Get range including surrounding whitespace
                  let startIndex = functionNode.range[0];
                  let endIndex = functionNode.range[1];
                  const code = sourceCode.text;
                  
                  // Include leading whitespace from beginning of line
                  while (startIndex > 0 && code[startIndex - 1] !== '\n') {
                    if (!/\s/.test(code[startIndex - 1])) {
                      break;
                    }
                    startIndex--;
                  }
                  
                  // Include trailing whitespace and newline
                  while (endIndex < code.length && /\s/.test(code[endIndex])) {
                    if (code[endIndex] === '\n') {
                      endIndex++;
                      break;
                    }
                    endIndex++;
                  }
                  
                  return fixer.removeRange([startIndex, endIndex]);
                },
              },
            ],
          });
        }
      },
    };
  },
};
