# Migration Guide

This document summarizes breaking/behavioral changes introduced across UX issue #127 phases.

## vNext (Phase 2–3)

### Defaults
- `init` now generates AGENTS.md and eslint.config.mjs by default
  - Use `--no-agents` to skip AGENTS.md
  - Use `--no-eslint` to skip ESLint config
- Architecture guardrails are enabled by default
  - Disable with `--no-arch` or `--arch=false`
- `.cursorrules` remains opt-in via `--cursor`

### New Commands
- `setup`: runs `learn` then `init`
  - Interactive by default
  - `--yes` runs learn(strict+apply) and init(defaults)
  - `--skip-learn` to only run `init`

### Learn Enhancements
- Interactive `learn` suggests an inferred domain (dev-tools/cli/web-app) and applies on accept
- Interactive `learn` offers to generate AGENTS.md and eslint.config.mjs at the end
  - Default-on; honors `--no-agents` and `--no-eslint`
  - Honors `--arch` / `--no-arch` by updating `.ai-coding-guide.json` first

### Fixes
- Architecture + domainPriority persistence in `.ai-coding-guide.json` when running `setup` after `learn`
- `AGENTS.md` footer updated to reference `.ai-coding-guide.json`

### Deprecations (soft)
- `--agents` and `--eslint` are no longer required (defaults are on)
  - Flags remain accepted for compatibility; a note is printed when used

### Recommended Usage
```bash
# One-command setup
npx eslint-plugin-ai-code-snifftest setup --yes

# Or: learn first, then init
npx eslint-plugin-ai-code-snifftest learn --interactive
npx eslint-plugin-ai-code-snifftest init
```
