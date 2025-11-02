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
 * Checks if a literal is a numeric literal (not BigInt, not string)
 * @param {ASTNode} node - The literal node
 * @returns {boolean} - True if numeric literal
 */
function isNumericLiteral(node) {
  if (node.type !== 'Literal') {
    return false;
  }
  
  // CRITICAL: Skip BigInt literals (different type semantics)
  if (node.bigint !== undefined) {
    return false;
  }
  
  // Only process numeric values
  return typeof node.value === 'number';
}

/**
 * Checks if an expression tree contains only numeric literals
 * @param {ASTNode} node - The expression node
 * @returns {boolean} - True if all operands are numeric literals
 */
function isAllLiterals(node) {
  if (node.type === 'Literal') {
    return isNumericLiteral(node);
  }

  if (node.type === 'UnaryExpression') {
    // Handle unary minus/plus for negative numbers
    if (node.operator === '-' || node.operator === '+') {
      return isAllLiterals(node.argument);
    }
    return false;
  }

  if (node.type === 'BinaryExpression') {
    return isAllLiterals(node.left) && isAllLiterals(node.right);
  }

  return false;
}

/**
 * Recursively evaluates an expression tree
 * @param {ASTNode} node - The expression node
 * @returns {number|null} - The evaluated result
 */
function evaluateTree(node) {
  if (node.type === 'Literal') {
    return node.value;
  }

  if (node.type === 'UnaryExpression') {
    const arg = evaluateTree(node.argument);
    if (arg === null) return null;
    
    switch (node.operator) {
      case '-':
        return -arg;
      case '+':
        return +arg;
      default:
        return null;
    }
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
    /**
     * Checks if node is in a context where calculation should be preserved
     * @param {ASTNode} node - The node to check
     * @returns {boolean} - True if should skip
     */
    function shouldSkipContext(node) {
      let parent = node.parent;
      
      // Skip if in template literal
      if (parent && parent.type === 'TemplateLiteral') {
        return true;
      }
      
      // Skip if in comparison (returns boolean, not number)
      if (parent && ['BinaryExpression', 'LogicalExpression'].includes(parent.type)) {
        const comparisonOps = ['==', '===', '!=', '!==', '<', '>', '<=', '>='];
        if (comparisonOps.includes(parent.operator)) {
          return true;
        }
      }
      
      // Skip if used as computed property key
      if (parent && parent.type === 'MemberExpression' && parent.computed && parent.property === node) {
        return true;
      }
      
      return false;
    }

    /**
     * Attempt to find an identifier name owning this expression (variable or assignment)
     * @param {ASTNode} node
     * @returns {string|null}
     */
    function getOwningIdentifierName(node) {
      let cur = node;
      while (cur && cur.parent) {
        const p = cur.parent;
        if (p.type === 'VariableDeclarator' && p.id && p.id.type === 'Identifier') {
          return p.id.name;
        }
        if (p.type === 'AssignmentExpression' && p.left && p.left.type === 'Identifier') {
          return p.left.name;
        }
        cur = p;
      }
      return null;
    }

    const SCIENTIFIC_TERMS = [
      // Astronomy / orbital mechanics
      'longitude','latitude','ecliptic','equinox','solstice','aphelion','perihelion','ascending','descending','node',
      'orbital','orbit','kepler','ephemeris','elements','saros','metonic','draconic','anomalistic','sidereal','synodic','tropical',
      // Motion / physics
      'motion','velocity','acceleration','angular','epoch','julian'
    ];

    const PHYSICAL_CONSTANT_SNIPPETS = [
      '365.25','365.2422','29.53059','27.32166','27.55455','27.21222'
    ];

    /**
     * Decide if a numeric-only expression likely represents a scientific formula and should be skipped.
     * Uses heuristics: high precision result, presence of physical constants, scientific variable name, extreme magnitude,
     * and 360 involved in division.
     * @param {ASTNode} node
     * @param {number} result
     */
    function shouldSkipScientificCalculation(node) {
      // Heuristic: contains physical constants in source
      const src = context.getSourceCode().getText(node);
      if (PHYSICAL_CONSTANT_SNIPPETS.some((c) => src.includes(c))) return true;

      // Heuristic: special-case 360 in division contexts (degrees per something)
      if (src.includes('360') && (src.includes('/ 360') || src.includes('360 /'))) return true;

      // Heuristic: scientific variable names
      const owner = getOwningIdentifierName(node);
      if (owner) {
        const lower = owner.toLowerCase();
        if (SCIENTIFIC_TERMS.some((t) => lower.includes(t))) return true;
      }

      return false;
    }

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
        
        // Skip if in special contexts
        if (shouldSkipContext(node)) {
          return;
        }

        // Only handle numeric calculations
        const result = evaluateTree(node);

        if (result === null || typeof result !== 'number') {
          return;
        }

        // NEW: skip likely scientific formulas
        if (shouldSkipScientificCalculation(node)) {
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
