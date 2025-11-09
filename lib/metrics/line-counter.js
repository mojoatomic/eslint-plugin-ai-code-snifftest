'use strict';

const fs = require('fs');

/**
 * Remove all comments from source code
 * - Multi-line comments (/* ... * / and /** ... * /)
 * - Single-line comments (// ...)
 *
 * Note: We use a best-effort regex approach; acceptable for telemetry.
 * For strict parsing, migrate to a language-aware parser in future.
 *
 * @param {string} code
 * @returns {string}
 */
function removeComments(code) {
  if (typeof code !== 'string') return '';
  let out = code.replace(/\/\*[\s\S]*?\*\//g, ''); // multi-line + JSDoc
  out = out.replace(/\/\/.*$/gm, ''); // single-line
  return out;
}

/**
 * Remove blank and whitespace-only lines
 * @param {string} code
 * @returns {string}
 */
function removeBlankLines(code) {
  if (typeof code !== 'string') return '';
  return code
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .join('\n');
}

/**
 * Count executable lines of code (excluding comments/blank lines)
 * @param {string} code
 * @returns {number}
 */
function countExecutableLines(code) {
  const withoutComments = removeComments(code);
  const withoutBlanks = removeBlankLines(withoutComments);
  if (!withoutBlanks) return 0;
  return withoutBlanks.split(/\r?\n/).length;
}

/**
 * Get file line metrics
 * @param {string} filePath
 * @returns {{physical:number, executable:number, comments:number, commentRatio:number}|null}
 */
function getFileLineMetrics(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    const physical = text.split(/\r?\n/).length;
    const executable = countExecutableLines(text);
    const comments = Math.max(0, physical - executable);
    const commentRatio = physical > 0 ? comments / physical : 0;
    return { physical, executable, comments, commentRatio };
  } catch {
    return null;
  }
}

module.exports = {
  removeComments,
  removeBlankLines,
  countExecutableLines,
  getFileLineMetrics
};
