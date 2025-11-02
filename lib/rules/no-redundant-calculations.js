/**
 * @fileoverview Detect redundant calculations that should be computed at compile time
 * @author mojoatomic
 */
"use strict";

/* eslint-disable eslint-plugin/require-meta-has-suggestions */

const { readProjectConfig } = require('../utils/project-config');
const { hasScientificTerm } = require('../constants');

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Format numeric output to avoid excessive floating precision while preserving intent.
 * - If the original expression used exponential notation, keep exponential.
 * - Otherwise, round to at most 6 decimal places and trim trailing zeros.
 * @param {number} value
 * @param {string} src
 * @returns {string}
 */
function formatNumber(value, src) {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  const preferExp = /[eE]/.test(src || "");
  if (preferExp) {
    // keep compact exponential form
    // use minimal decimals that still conveys value succinctly
    const exp = value.toExponential();
    // Normalize like '3e-7' (remove unnecessary +0 padding if any)
    return exp.replace(/\+?0+(?=e)/i, "").replace(/\.0+e/i, "e");
  }
  // Plain decimal: round to ≤6 decimals
  const rounded = Number(value.toFixed(6));
  // Trim trailing zeros
  const s = String(rounded);
  if (s.includes(".")) {
    return s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  }
  return s;
}

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
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          preserveIntentSuggestion: { type: 'boolean' }
        },
        additionalProperties: false
      }
    ],
    messages: {
      redundantCalculation: 'Calculate this at compile time: {{ result }}',
      preserveIntent: 'Keep formula and append computed value'
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
      'motion','velocity','acceleration','angular','epoch','julian',
      // Angle-ish
      'angle','rotation','degree','azimuth'
    ];

    // Domain-scoped constants (v1.1.1 restricted set)
    const PHYSICAL_CONSTANT_SNIPPETS = [
      // Astronomy
      '365.25','365.2422','29.53059','27.32166','27.55455','27.21222',
      // Unit conversions
      '25.4','2.54','0.3048','0.0254','0.9144','1.60934','1.609344',
      // Minimal physics/math ratios
      '299792458','9.80665','3.14159','2.71828','1.61803'
    ];

    /**
     * Decide if a numeric-only expression likely represents a scientific formula and should be skipped.
     * Uses heuristics: high precision result, presence of physical constants, scientific variable name, extreme magnitude,
     * and 360 involved in division.
     * @param {ASTNode} node
     * @param {number} result
     */
    function shouldSkipScientificCalculation(node) {
      const src = context.getSourceCode().getText(node);

      // Multi-day formula: N * 86400e3 (2..365 days)
      const md = src.match(/^\s*(?:([2-9]|[1-9]\d|[12]\d\d|3[0-5]\d))\s*\*\s*86400e3\s*$/) ||
                 src.match(/^\s*86400e3\s*\*\s*([2-9]|[1-9]\d|[12]\d\d|3[0-5]\d)\s*$/);
      if (md) return true;

      // Contains domain constants (restricted set)
      if (PHYSICAL_CONSTANT_SNIPPETS.some((c) => src.includes(c))) return true;


      // Special-case 360: only when division AND angle-like variable name context
      if ((/\/\s*360|360\s*\//.test(src))) {
        const owner = getOwningIdentifierName(node) || "";
        if (owner && /angle|rotation|degree|azimuth|longitude|latitude/i.test(owner)) {
          return true;
        }
      }

      // Music-specific: 440 or 44100 only with strong context
      if (/(^|\W)(440|44100)(\W|$)/.test(src)) {
        const owner = getOwningIdentifierName(node) || "";
        const filename = context.getFilename ? String(context.getFilename()) : "";
        const strongMusicContext = /^(frequency|pitch|tuning|concert|a4)$/i.test(owner) ||
                                   /music|audio/i.test(owner) || /\/music\//i.test(filename) || /\/audio\//i.test(filename);
        if (strongMusicContext) return true;
      }

      // Scientific variable names (general context)
      const owner = getOwningIdentifierName(node);
      if (owner) {
        const lower = owner.toLowerCase();
        if (SCIENTIFIC_TERMS.some((t) => lower.includes(t))) return true;
        // NEW: Use constants library semantic term detection
        if (hasScientificTerm(owner)) return true;
      }

      return false;
    }

    // Read project config once per lint run
    const projectConfig = readProjectConfig(context);

    function isDeclaredConstant(value) {
      if (!projectConfig || !projectConfig.constants) return false;
      const eps = 1e-12;
      for (const domain of Object.keys(projectConfig.constants)) {
        const arr = projectConfig.constants[domain];
        if (!Array.isArray(arr)) continue;
        for (const item of arr) {
          let n = null;
          if (typeof item === 'number') n = item;
          else if (typeof item === 'string') {
            const parsed = Number(item);
            if (!Number.isNaN(parsed)) n = parsed; else continue;
          }
          if (n !== null) {
            if (Object.is(n, value)) return true;
            if (Math.abs(n - value) <= eps) return true;
          }
        }
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

        // Skip when declared in project config constants
        if (isDeclaredConstant(result)) {
          return;
        }

        // NEW: skip likely scientific formulas
        if (shouldSkipScientificCalculation(node)) {
          return;
        }

        // Report the issue
        const src = context.getSourceCode().getText(node);
        const formatted = formatNumber(result, src);
        const options = (context.options && context.options[0]) || {};
        const addSuggestion = !!options.preserveIntentSuggestion;
        const report = {
          node,
          messageId: 'redundantCalculation',
          data: { result: formatted },
          fix(fixer) { return fixer.replaceText(node, formatted); }
        };
        if (addSuggestion) {
          report.suggest = [
            {
              messageId: 'preserveIntent',
              fix(fixer) {
                return fixer.replaceText(node, `${src} /* = ${formatted} */`);
              }
            }
          ];
        }
        context.report(report);
      }
    };
  },
};
