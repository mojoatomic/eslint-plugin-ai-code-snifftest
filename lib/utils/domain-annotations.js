"use strict";

function getDomainAnnotation(node, context) {
  const src = context.getSourceCode();
  const comments = src.getCommentsBefore(node) || [];
  for (const c of comments) {
    const m = String(c.value || '').match(/@domain\s+([A-Za-z0-9_-]+)/);
    if (m) return m[1];
  }
  return null;
}

function getFileDomains(context) {
  const src = context.getSourceCode();
  const all = src.getAllComments ? src.getAllComments() : [];
  for (const c of (all || []).slice(0, 20)) {
    const m = String(c.value || '').match(/@domains?\s+([A-Za-z0-9_,\s-]+)/);
    if (m) {
      return m[1].split(',').map((s) => s.trim()).filter(Boolean);
    }
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