/**
 * @fileoverview Detect if/else branches that do the same thing
 * @author mojoatomic
 */
"use strict";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Compares two AST nodes for structural equality
 * @param {ASTNode} node1 - First node to compare
 * @param {ASTNode} node2 - Second node to compare
 * @returns {boolean} - True if nodes are structurally equivalent
 */
function areNodesEquivalent(node1, node2) {
  if (!node1 || !node2) {
    return node1 === node2;
  }

  if (node1.type !== node2.type) {
    return false;
  }

  // Compare based on node type
  switch (node1.type) {
    case 'Literal':
      return node1.value === node2.value;

    case 'Identifier':
      return node1.name === node2.name;

    case 'MemberExpression':
      return areNodesEquivalent(node1.object, node2.object) &&
             areNodesEquivalent(node1.property, node2.property) &&
             node1.computed === node2.computed;

    case 'CallExpression':
      return areNodesEquivalent(node1.callee, node2.callee) &&
             node1.arguments.length === node2.arguments.length &&
             node1.arguments.every((arg, i) => areNodesEquivalent(arg, node2.arguments[i]));

    case 'BinaryExpression':
    case 'LogicalExpression':
      return node1.operator === node2.operator &&
             areNodesEquivalent(node1.left, node2.left) &&
             areNodesEquivalent(node1.right, node2.right);

    case 'UnaryExpression':
      return node1.operator === node2.operator &&
             areNodesEquivalent(node1.argument, node2.argument);

    case 'ReturnStatement':
      return areNodesEquivalent(node1.argument, node2.argument);

    case 'ExpressionStatement':
      return areNodesEquivalent(node1.expression, node2.expression);

    case 'AssignmentExpression':
      return node1.operator === node2.operator &&
             areNodesEquivalent(node1.left, node2.left) &&
             areNodesEquivalent(node1.right, node2.right);

    case 'VariableDeclaration':
      return node1.kind === node2.kind &&
             node1.declarations.length === node2.declarations.length &&
             node1.declarations.every((decl, i) => areNodesEquivalent(decl, node2.declarations[i]));

    case 'VariableDeclarator':
      return areNodesEquivalent(node1.id, node2.id) &&
             areNodesEquivalent(node1.init, node2.init);

    case 'BlockStatement':
      return node1.body.length === node2.body.length &&
             node1.body.every((stmt, i) => areNodesEquivalent(stmt, node2.body[i]));

    default:
      // For other node types, use source code comparison
      return false;
  }
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: "Detect if/else branches that do the same thing",
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
