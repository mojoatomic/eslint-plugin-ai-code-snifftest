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
const biology = require('./biology');
const chemistry = require('./chemistry');
const cs = require('./cs');
const networking = require('./networking');
const graphics = require('./graphics');
const geodesy = require('./geodesy');

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
  statistics,
  biology,
  chemistry,
  cs,
networking,
  graphics,
  geodesy
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
  const matches = [];
  for (const { domain, term } of allTerms()) {
    const t = term.toLowerCase();
    const idx = lower.indexOf(t);
    if (idx !== -1) {
      matches.push({ domain, term: t, len: t.length, idx, rank: DOMAIN_RANK[domain] ?? 1e9 });
    }
  }
  if (!matches.length) return null;
  matches.sort((a, b) => {
    if (b.len !== a.len) return b.len - a.len; // longer term first
    if (a.idx !== b.idx) return a.idx - b.idx; // earlier occurrence first
    return a.rank - b.rank; // domain priority
  });
  return matches[0].domain;
}

const DOMAIN_ORDER = Object.freeze(Object.keys(DOMAINS));
const DOMAIN_RANK = DOMAIN_ORDER.reduce((acc, d, i) => { acc[d] = i; return acc; }, {});

module.exports = {
  DOMAINS,
  isPhysicalConstant,
  hasScientificTerm,
  getDomainForValue,
  getDomainForName
};
