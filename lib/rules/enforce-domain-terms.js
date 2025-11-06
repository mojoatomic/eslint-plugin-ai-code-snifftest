/**
 * @fileoverview Encourage domain-specific naming using declared project terms
 */
'use strict';


const { readProjectConfig } = require('../utils/project-config');
const { DOMAINS } = require('../constants');

function toPascalCase(s) {
  return String(s || '')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

function hasDomainTerm(name, terms) {
  const lname = String(name || '').toLowerCase();
  for (const t of terms) {
    const lt = String(t || '').toLowerCase();
    if (!lt) continue;
    if (lname.includes(lt)) return true;
  }
  return false;
}

function collectDomainTerms(project, options) {
  const opt = options && options[0] ? options[0] : {};
  const fromOptions = Array.isArray(opt.requiredTerms) ? opt.requiredTerms : [];

  // Priority: active domains -> project terms/options
  const priorityDomains = Array.isArray(project?.domainPriority) && project.domainPriority.length
    ? project.domainPriority
    : (project?.domains?.primary ? [project.domains.primary, ...(project?.domains?.additional || [])] : []);

  const priorityTerms = [];
  for (const d of priorityDomains) {
    const mod = DOMAINS && DOMAINS[d];
    if (mod && Array.isArray(mod.terms)) {
      for (const t of mod.terms) priorityTerms.push(String(t));
    }
  }

  const terms = new Set();
  for (const t of priorityTerms) terms.add(t);
  for (const t of fromOptions) terms.add(String(t));

  const cfg = project && project.terms ? project.terms : {};
  const buckets = [cfg.entities || [], cfg.properties || [], cfg.actions || [], cfg.preferredNames || []];
  for (const bucket of buckets) {
    if (!Array.isArray(bucket)) continue;
    for (const t of bucket) terms.add(String(t));
  }
  return Array.from(terms).filter(Boolean);
}

function collectExemptions(project, options) {
  const opt = options && options[0] ? options[0] : {};
  const out = new Set();
  for (const n of opt.exemptNames || []) out.add(String(n));
  const cfg = project && project.terms ? project.terms : {};
  for (const n of cfg.exemptNames || []) out.add(String(n));
  const naming = project && project.naming ? project.naming : {};
  for (const n of naming.exemptNames || []) out.add(String(n));
  return out;
}

const GENERIC_TOKENS = [
  'data','value','result','item','object','obj','array','arr','string','str','number','num','count','list','map','set','tmp','temp','val','flag','name','id'
];

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Encourage domain-specific naming using declared project terms',
      recommended: false,
      url: null,
    },
    hasSuggestions: true,
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          requiredTerms: { type: 'array', items: { type: 'string' } },
          preferredNames: { type: 'array', items: { type: 'string' } },
          exemptNames: { type: 'array', items: { type: 'string' } },
          maxSuggestions: { type: 'number' }
        },
        additionalProperties: false,
      }
    ],
    messages: {
      missingDomain: 'Identifier "{{name}}" does not include any declared domain term',
      suggestRename: 'Rename to include domain term: {{suggestion}}'
    },
  },

  create(context) {
    const project = readProjectConfig(context) || {};
    const options = context.options || [];
    const terms = collectDomainTerms(project, options);
    const exemptions = collectExemptions(project, options);
    const opt = options[0] || {};
    const maxSuggestions = typeof opt.maxSuggestions === 'number' ? Math.max(1, Math.min(5, opt.maxSuggestions)) : 3;

    function shouldConsider(name) {
      if (!name) return false;
      if (name.length <= 2) return false; // skip i, j, k
      if (exemptions.has(name)) return false;
      return true;
    }

    function buildSuggestions(name) {
      const suggestions = [];
      const base = GENERIC_TOKENS.includes(name) ? '' : toPascalCase(name);
      for (const t of terms) {
        if (suggestions.length >= maxSuggestions) break;
        const cand = base ? `${t}${base}` : String(t);
        if (!cand || cand === name) continue;
        suggestions.push(cand);
      }
      return suggestions;
    }

    function report(idNode) {
      const name = idNode.name || '';
      if (!shouldConsider(name)) return;
      if (!terms.length) return; // nothing to enforce
      if (hasDomainTerm(name, terms)) return; // already compliant

      const suggestions = buildSuggestions(name);
      const report = { node: idNode, messageId: 'missingDomain', data: { name } };
      if (suggestions.length) {
        report.suggest = suggestions.map((s) => ({
          messageId: 'suggestRename',
          data: { suggestion: s },
          // NOTE: Safe rename across scopes is not feasible here; provide targeted replace at declaration only.
          fix(fixer) { return fixer.replaceText(idNode, s); }
        }));
      }
      context.report(report);
    }

    return {
      VariableDeclarator(node) {
        if (node.id && node.id.type === 'Identifier') report(node.id);
      },
      FunctionDeclaration(node) {
        if (node.id) report(node.id);
      },
      ClassDeclaration(node) {
        if (node.id) report(node.id);
      },
      AssignmentExpression(node) {
        if (node.left && node.left.type === 'Identifier') report(node.left);
      },
      CatchClause(node) {
        if (node.param && node.param.type === 'Identifier') report(node.param);
      }
    };
  },
};