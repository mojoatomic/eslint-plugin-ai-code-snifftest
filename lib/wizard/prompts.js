"use strict";

const readline = require('readline');

function createPrompt() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((resolve) => rl.question(q, (ans) => resolve(ans)));
  const confirm = async (q) => {
    const a = String(await ask(q)).trim().toLowerCase();
    return !a || a.startsWith('y');
  };
  const selectFromList = async (title, items) => {
    if (Array.isArray(items) && items.length) {
      console.log(title);
      items.forEach((it, i) => console.log(`  [${i + 1}] ${it}`));
    }
    const a = String(await ask('Pick by index or name (Enter to skip): ')).trim();
    if (!a) return null;
    const idx = Number(a);
    if (Number.isInteger(idx) && idx >= 1 && idx <= items.length) return items[idx - 1];
    if (items.includes(a)) return a;
    return null;
  };
  const close = () => rl.close();
  return { ask, confirm, selectFromList, close };
}

module.exports = { createPrompt };
