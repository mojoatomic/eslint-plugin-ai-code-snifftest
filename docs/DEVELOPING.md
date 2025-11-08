# Developing (Self-hosting guardrails)

When we lint/fix this repo, we’re linting the plugin’s own rule sources. That can cause our rule fixers to mutate rule implementations, changing semantics and breaking tests.

Guardrails in this repo
- ESLint override disables our plugin rules on `lib/rules/**/*.js` to prevent self-fixer mutations.
- Safe fix scripts:
  - `npm run lint:fix:layout` — applies layout-only fixes (formatting), safest for mass sweeps
  - `npm run lint:fix:sweep` — runs `--fix` but skips `lib/rules/**` to protect rule code

Suggested workflow for sweeps
1) `npm run lint:fix:layout`
2) `npm run lint:fix:sweep`
3) `npm run lint:json && npx eslint-plugin-ai-code-snifftest analyze --input=lint-results.json`
4) `npm test`

Notes
- End-users of the plugin won’t hit this hazard; it’s specific to self-hosting (running rule fixers against their own source).
- For deeper refactors in `lib/rules/**`, run full lint without `--fix` first and commit deliberately reviewed edits.
