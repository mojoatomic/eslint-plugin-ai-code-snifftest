'use strict';

const path = require('path');

async function setupCommand(cwd, args) {
  const { learnCommand } = require(path.join(__dirname, '..', 'learn'));
  const { initCommand } = require(path.join(__dirname, '..', 'init'));
  const { detectProjectContext } = require(path.join(__dirname, '..', '..', 'utils', 'project-detection'));

  // 1) Learn phase (unless skipped)
  const skipLearn = !!(args['skip-learn'] || args.skipLearn);
  if (!skipLearn) {
    const learnArgs = { ...args };
    // If --yes provided, do a non-interactive strict apply
    if (args.yes) {
      learnArgs.strict = true;
      learnArgs.apply = true;
      delete learnArgs.interactive;
    } else {
      // Prefer interactive reconciliation when TTY
      learnArgs.interactive = true;
    }
    const code = await Promise.resolve(learnCommand(cwd, learnArgs));
    if (code !== 0) return code;
  }

  // 2) Init phase: generate everything by default (AGENTS.md + ESLint); cursor remains opt-in
  const initArgs = { ...args, yes: true };

  // Phase 2: Domain handling for non-interactive setup
  if (initArgs.yes && !initArgs.primary) {
    const ctx = detectProjectContext(cwd);
    const inferred = ctx && ctx.type === 'dev-tools' ? 'dev-tools'
      : ctx && ctx.type === 'cli' ? 'cli'
      : ctx && ctx.type === 'web-app' ? 'web-app'
      : null;
    if (inferred) {
      initArgs.primary = inferred;
    } else {
      console.error('Error: --primary required when using --yes (unable to infer domain)');
      console.error('Example: npx eslint-plugin-ai-code-snifftest setup --yes --primary=dev-tools');
      return 1;
    }
  }

  // Ensure changes from init persist to .ai-coding-guide.json after learn
  const prevForce = process.env.FORCE_AI_CONFIG;
  process.env.FORCE_AI_CONFIG = '1';
  const code2 = initCommand(cwd, initArgs);
  if (prevForce === undefined) delete process.env.FORCE_AI_CONFIG; else process.env.FORCE_AI_CONFIG = prevForce;
  return code2;
}

module.exports = { setupCommand };
