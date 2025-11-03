"use strict";

const { gte, resolvePkgVersion } = require('./version');

function checkRequirements(cwd, opts = { requireEslint: true }) {
  if (process.env.SKIP_AI_REQUIREMENTS || process.env.NODE_ENV === 'test') return true;
  let ok = true;
  const nodeVer = process.versions.node;
  if (!gte(nodeVer, '18.0.0')) {
    console.error(`❌ Node.js 18+ required. You have ${nodeVer}. Install Node 18+ (recommended 20+).`);
    ok = false;
  } else {
    console.log(`✅ Node.js ${nodeVer}`);
  }
  if (opts.requireEslint) {
    const eslintVer = resolvePkgVersion('eslint', cwd);
    if (!eslintVer || !gte(eslintVer, '9.0.0')) {
      console.error(`❌ ESLint 9+ required. Your project: ${eslintVer || 'not installed'}.`);
      console.error(`   Upgrade: npm install eslint@^9.0.0`);
      ok = false;
    } else {
      console.log(`✅ ESLint ${eslintVer}`);
    }
  }
  const reactVer = resolvePkgVersion('react', cwd);
  if (reactVer && !gte(reactVer, '18.0.0')) {
    console.warn(`⚠️ React 18+ recommended. Detected ${reactVer}.`);
  }
  const vueVer = resolvePkgVersion('vue', cwd);
  if (vueVer && !gte(vueVer, '3.0.0')) {
    console.warn(`⚠️ Vue 3+ recommended. Detected ${vueVer}.`);
  }
  const nextVer = resolvePkgVersion('next', cwd);
  if (nextVer && !gte(nextVer, '13.0.0')) {
    console.warn(`⚠️ Next.js 13+ recommended. Detected ${nextVer}.`);
  }
  return ok;
}

module.exports = {
  checkRequirements
};
