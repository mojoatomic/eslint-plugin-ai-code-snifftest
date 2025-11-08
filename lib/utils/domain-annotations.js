'use strict';

// Lightweight cache keyed by SourceCode instance
const cache = new WeakMap();

function getDomainComments(context) {
  const src = context.getSourceCode();
  let entry = cache.get(src);
  if (!entry) {
    const all = src.getAllComments ? src.getAllComments() : [];
    const domainComments = [];
    for (const c of all || []) {
      const val = String(c.value || '');
      const m1 = val.match(/@domain\s+([A-Za-z0-9_-]+)/);
      const m2 = val.match(/@domains?\s+([A-Za-z0-9_,\s-]+)/);
      if (m1) domainComments.push({ type: 'single', domain: m1[1], loc: c.loc });
      else if (m2) domainComments.push({ type: 'multi', domains: m2[1].split(',').map(s=>s.trim()).filter(Boolean), loc: c.loc });
    }
    entry = { domainComments };
    cache.set(src, entry);
  }
  return entry.domainComments;
}

function getNearestSectionDomain(node, context) {
  try {
    if (!node.loc) return null;
    const line = node.loc.start.line;
    let nearest = null;
    for (const dc of getDomainComments(context)) {
      if (dc.type === 'single' && dc.loc && dc.loc.end && dc.loc.end.line < line) {
        if (!nearest || dc.loc.end.line > nearest.loc.end.line) nearest = dc;
      }
    }
    return nearest ? nearest.domain : null;
  } catch {
    return null;
  }
}

function getDomainAnnotation(node, context) {
  const src = context.getSourceCode();
  const comments = src.getCommentsBefore(node) || [];
  for (const c of comments) {
    const m = String(c.value || '').match(/@domain\s+([A-Za-z0-9_-]+)/);
    if (m) return m[1];
  }
  // Fallback to nearest section-level @domain above this node
  const section = getNearestSectionDomain(node, context);
  if (section) return section;
  return null;
}

function getFileDomains(context) {
  // Use cached parsed comments and look for first multi-domain declaration
  for (const dc of getDomainComments(context)) {
    if (dc.type === 'multi') return dc.domains;
  }
  return [];
}

function hasInlineDomainTag(node, context) {
  const src = context.getSourceCode();
  const text = src.getText(node) + (src.getCommentsAfter(node)?.map((c) => c.value).join(' ') || '');
  return /@domain\s+[A-Za-z0-9_-]+/.test(text);
}

module.exports = {
  getDomainAnnotation,
  getFileDomains,
  hasInlineDomainTag
};
