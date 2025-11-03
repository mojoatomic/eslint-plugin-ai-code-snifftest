"use strict";

const fs = require('fs');
const path = require('path');

function writeFile(cwd, relPath, content, options = {}) {
  const full = path.join(cwd, relPath);
  if (fs.existsSync(full) && !options.overwrite) {
    throw new Error(`File ${relPath} already exists`);
  }
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  return full;
}

function writeFiles(cwd, files) {
  const results = [];
  for (const f of files) {
    try {
      writeFile(cwd, f.path, f.content, { overwrite: f.overwrite });
      results.push({ path: f.path, status: 'written' });
    } catch (err) {
      results.push({ path: f.path, status: 'error', error: err && err.message });
    }
  }
  return results;
}

function readFile(cwd, relPath) {
  const full = path.join(cwd, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

function readJsonFile(cwd, relPath) {
  const txt = readFile(cwd, relPath);
  if (txt == null) return null;
  try {
    return JSON.parse(txt);
  } catch (err) {
    throw new Error(`Invalid JSON in ${relPath}: ${err && err.message}`);
  }
}

module.exports = {
  writeFile,
  writeFiles,
  readFile,
  readJsonFile
};
