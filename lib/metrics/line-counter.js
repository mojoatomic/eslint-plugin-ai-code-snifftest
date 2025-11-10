'use strict';

const fs = require('fs');

function removeComments(code) {
  if (typeof code !== 'string') return '';
  let out = code.replace(/\/\*[\s\S]*?\*\//g, '');
  out = out.replace(/\/\/.*$/gm, '');
  return out;
}

function removeBlankLines(code) {
  if (typeof code !== 'string') return '';
  return code.split(/\r?\n/).filter((l) => l.trim().length > 0).join('\n');
}

function countExecutableLines(code) {
  const noComments = removeComments(code);
  const noBlanks = removeBlankLines(noComments);
  if (!noBlanks) return 0;
  return noBlanks.split(/\r?\n/).length;
}

function getFileLineMetrics(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    const physical = text.split(/\r?\n/).length;
    const executable = countExecutableLines(text);
    const comments = Math.max(0, physical - executable);
    const commentRatio = physical > 0 ? comments / physical : 0;
    return { physical, executable, comments, commentRatio };
  } catch (_) {
    return null;
  }
}

module.exports = {
  removeComments,
  removeBlankLines,
  countExecutableLines,
  getFileLineMetrics
};
