"use strict";

const astronomy = require('./astronomy');
const units = require('./units');
const acoustics = require('./acoustics');
const physics = require('./physics');
const time = require('./time');
const math = require('./math');
const finance = require('./finance');
const geometry = require('./geometry');
const statistics = require('./statistics');

const DOMAINS = Object.freeze({
  // Prioritize generic time-domain matches (e.g., epoch) before astronomy
  time,
  astronomy,
  units,
  acoustics,
  physics,
  math,
  finance,
  geometry,
  statistics
});

const EPS = 1e-12;
function approxEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'number' || typeof b !== 'number') return false;
  return Math.abs(a - b) <= EPS;
}

function allConstants() {
  const out = [];
  for (const [domain, mod] of Object.entries(DOMAINS)) {
    const arr = Array.isArray(mod.constants) ? mod.constants : [];
    for (const v of arr) {
      if (typeof v === 'number') out.push({ domain, value: v });
    }
  }
  return out;
}

function allTerms() {
  const out = [];
  for (const [domain, mod] of Object.entries(DOMAINS)) {
    const arr = Array.isArray(mod.terms) ? mod.terms : [];
    for (const t of arr) {
      out.push({ domain, term: String(t) });
    }
  }
  return out;
}

function isPhysicalConstant(value) {
  if (typeof value !== 'number') return false;
  for (const { value: v } of allConstants()) {
    if (approxEqual(v, value)) return true;
  }
  return false;
}

function hasScientificTerm(name) {
  const lower = String(name || '').toLowerCase();
  if (!lower) return false;
  for (const { term } of allTerms()) {
    const lt = term.toLowerCase();
    if (lt && lower.includes(lt)) return true;
  }
  return false;
}

function getDomainForValue(value) {
  if (typeof value !== 'number') return null;
  for (const { domain, value: v } of allConstants()) {
    if (approxEqual(v, value)) return domain;
  }
  return null;
}

function getDomainForName(name) {
  const lower = String(name || '').toLowerCase();
  if (!lower) return null;
  for (const { domain, term } of allTerms()) {
    if (lower.includes(term.toLowerCase())) return domain;
  }
  return null;
}

module.exports = {
  DOMAINS,
  isPhysicalConstant,
  hasScientificTerm,
  getDomainForValue,
  getDomainForName
};