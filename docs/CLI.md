# CLI Reference

This document describes all commands, options, and environment variables for `eslint-plugin-ai-code-snifftest`.

Note: .ai-coding-guide.md generation has been removed. Sources of truth are:
- .ai-coding-guide.json (machine‑readable config)
- AGENTS.md (human‑readable guidance for AI tools)

## Requirements
- Node.js ≥ 18
- ESLint ≥ 9

The CLI verifies versions unless disabled with SKIP_AI_REQUIREMENTS=1.

---

## Commands

- setup: Run learn then init (generate everything by default)
- init: Generate configuration and docs
- learn: Analyze your project and propose config updates
- scaffold: Create a starter external constants package
- analyze: Summarize ESLint JSON into domain-aware insights
- plan: Create a phased roadmap from analysis
- create-issues: Generate issue markdown files (files-only, no API calls)

---

## setup

Run learn then init.

### Synopsis

```bash
npx eslint-plugin-ai-code-snifftest setup [options]
```

### Behavior
- Interactive by default: runs learn reconciliation wizard, then writes init outputs with defaults.
- Non-interactive: `--yes` runs learn in strict apply mode and init with defaults (AGENTS.md + ESLint).
  - Domain required: pass `--primary` or ensure project type can be inferred (eslint-plugin → dev-tools, CLI with `bin` → cli, React/Vue → web-app). If not inferable, setup exits with guidance.
- External constants discovery is enabled by default; pass `--no-external` to opt out. Use `--allowlist` to constrain npm scopes.
- Skip learn with `--skip-learn` to only run init.

### Common options
- --skip-learn
  - Skip the learn phase.
- --yes
  - Non-interactive; auto-apply in learn and defaults in init.
- All init options apply (e.g., `--primary`, `--additional`, `--no-agents`, `--no-eslint`, `--cursor`, `--arch`, `--no-arch`).

### Examples
```bash
# One-command setup (non-interactive)
npx eslint-plugin-ai-code-snifftest setup --yes --primary=web-app

# Skip learn, just initialize files
npx eslint-plugin-ai-code-snifftest setup --yes --skip-learn --primary=cli --cursor
```

---

## init

Generate `.ai-coding-guide.json`, `AGENTS.md`, and `eslint.config.mjs` by default. `.cursorrules` is optional.

### Synopsis

```bash
npx eslint-plugin-ai-code-snifftest init [options]
```

### Common options

- --primary=<domain>
  - Set primary domain (e.g., web-app, cli, astronomy). Default: `general`.
- --additional=a,b,c
  - Comma‑separated additional domains.
- --yes
  - Non‑interactive mode; accept defaults for file generation.
- --cursor
  - Generate `.cursorrules`.
- --no-agents
  - Do not generate `AGENTS.md` (default: generated).
- --no-eslint
  - Do not generate `eslint.config.mjs` (default: generated; ES module). Architecture guardrails included if enabled.
- --no-arch
  - Disable architecture guardrails.
- --arch[=true|false]
  - Explicitly enable/disable architecture guardrails. Default: enabled.
- --no-external | --external=false
  - Disable external constants discovery (enabled by default).
- --external (interactive gating)
  - When running interactively, show external‑discovery prompts. Default interactive flow hides these unless `--external` is passed.
- --allowlist="@scope1,@scope2"
  - Limit external discovery to a comma‑separated list of npm scopes or package names. Regex strings are supported when starting with `^`.
- --minimumMatch=<0..1>
  - Override minimum match threshold for name detection (default 0.6).
- --minimumConfidence=<0..1>
  - Override minimum confidence for rules/learn integration (default 0.7).
- --debug
  - Write `.ai-init-debug.json` snapshot (same as AI_DEBUG_INIT=1).

### Interactive mode
If `--primary` is omitted and stdin is TTY (or `FORCE_CLI_INTERACTIVE=1`), the wizard prompts for:
- Primary/additional domains
- Architecture thresholds
- Whether to generate `.cursorrules`, `AGENTS.md`, and `eslint.config.mjs`

Note: `.ai-coding-guide.md` is not generated.

In interactive learn, after reconciliation you’ll be offered to:
- Accept an inferred domain for `domains.primary` (e.g., dev-tools/cli/web-app)
- Generate `AGENTS.md` and `eslint.config.mjs` immediately (defaults on; honor `--no-agents`, `--no-eslint`, and `--arch`/`--no-arch`).

### Architecture guardrails
Enabled by default. Disable with `--no-arch` or `--arch=false`.
Rules included when enabled:
- max-lines, max-lines-per-function, complexity, max-depth, max-params, max-statements
- Test files are exempted from complexity/statement/depth limits.

### Examples
```bash
# Non-interactive with defaults
npx eslint-plugin-ai-code-snifftest init --primary=web-app --additional=react,api --yes --cursor

# Disable architecture guardrails
npx eslint-plugin-ai-code-snifftest init --primary=cli --yes --no-arch

# Scope external discovery to whitelisted scopes (discovery is on by default)
npx eslint-plugin-ai-code-snifftest init --primary=general --yes --allowlist=@ai-constants,@company

# Opt out of external discovery entirely
npx eslint-plugin-ai-code-snifftest init --primary=general --yes --no-external
```

---

## learn

Analyze your project and propose updates to `.ai-coding-guide.json`.

### Synopsis
```bash
npx eslint-plugin-ai-code-snifftest learn [--interactive|--strict|--permissive] [options]
```

### Modes
- --interactive (default if TTY)
  - Guided reconciliation of naming/anti-patterns/constants.
- --strict
  - Non‑interactive; compute and print or apply results.
- --permissive
  - Non‑interactive; when used with `--apply`, writes `.ai-learn-report.json` instead of updating config.

### Options
- --sample=<N>
  - Sample size for scanning (default ~400 when unspecified).
- --no-cache
  - Disable scan cache.
- --apply
  - Apply suggested changes to `.ai-coding-guide.json` (or write `.ai-learn-report.json` in `--permissive`).
- --fingerprint
  - Write `.ai-constants/project-fingerprint.js` with top suggested constants.
- --minimumMatch=<0..1>
  - Override name match threshold (default 0.6).
- --minimumConfidence=<0..1>
  - Override minimum confidence (default 0.7).

### Examples
```bash
npx eslint-plugin-ai-code-snifftest learn --interactive --sample=300 --minimumConfidence=0.75
npx eslint-plugin-ai-code-snifftest learn --strict --apply
npx eslint-plugin-ai-code-snifftest learn --permissive --apply --fingerprint
```

---

## analyze

Summarize ESLint JSON results with categories, domain context, and a rough effort estimate.

### Synopsis
```bash
npx eslint-plugin-ai-code-snifftest analyze [--input=lint-results.json] [--output=analysis-report.md] [--format=markdown|json|html] [--top-files=10] [--min-count=1] [--max-examples=5]
```

### Behavior
- Reads ESLint JSON (e.g., `eslint -f json . > lint-results.json`).
- Categorizes violations (magic numbers, domain terms, complexity, architecture).
- Infers domain context using your `.ai-coding-guide.json` and the constants catalog (no hard-coded domain lists).
- Writes `analysis-report.md` by default.

### Options
- --input, -i: Path to ESLint JSON (default: lint-results.json)
- --output, -o: Output file (default: analysis-report.md)
- --format: markdown (default) | json | html
- --top-files: limit for hotspot lists (default: 10)
- --min-count: minimum occurrences to include in lists (default: 1)
- --max-examples: max examples per section (default: 5)
- --estimate-size=true|false: scale effort by file size (line count), capped at 2x (default: false)

---

## plan

Create a phased roadmap (Quick Wins, Domain Cleanup, Refactoring, Polish) from analysis categories.

### Synopsis
```bash
npx eslint-plugin-ai-code-snifftest plan [--input=lint-results.json] [--output=FIXES-ROADMAP.md] [--phases=4] [--team-size=1] [--top-files=10] [--min-count=1]
```

### Options
- --input, -i: Path to ESLint JSON (default: lint-results.json)
- --output, -o: Output file (default: FIXES-ROADMAP.md)
- --phases: Number of phases to include (default: 4)
- --team-size: Reserved for future capacity planning (default: 1)
- --top-files: limit for hotspot lists (default: 10)
- --min-count: minimum occurrences to include in lists (default: 1)

---

## create-issues

Generate issue markdown files from ESLint JSON analysis. Files-only: does NOT create tracker issues via API.

### Synopsis
```bash
npx eslint-plugin-ai-code-snifftest create-issues [--input=lint-results.json] [--output=issues] [--format=markdown|json] [--include-commands=github-cli|gitlab-cli] [--labels='lint,tech-debt'] [--top-files=10] [--min-count=1] [--max-examples=5]
```

### Behavior
- Produces `issues/` directory with phase-oriented markdown files.
- Shows "Configured Domains" (primary/additional) from `.ai-coding-guide.json`; suppresses "Domain Hints" when configured.
- Rich markdown in each phase file:
  - "## Summary": total violations, unique files, effort estimate (if `analysis.json` present)
  - "## Violations Breakdown": top rules; for domain terms, "By Generic Name" with domain-aware suggestions
  - "## Top Files Affected": top files with counts and first few violations per file
  - "### Examples": 3–5 examples with file:line, rule, message, and code snippet
  - "## Fix Strategy": category-specific remediation steps
  - "## Verification": commands to re-lint and re-analyze
  - "## Acceptance Criteria": concrete targets (e.g., reduce to ≤20% of current or 0)
- When no configured domains exist, includes "Detected Domains" and (only when all zero) "Domain Hints" inferred from violations.
- Adds a `00-README.md` with manual and optional CLI bulk-creation instructions.
- Platform-agnostic by default; optional `--include-commands` provides CLI snippets.

### Options
- --input, -i: Path to ESLint JSON (default: lint-results.json)
- --output, -o: Output directory (default: issues)
- --format: markdown (default) | json
- --include-commands: github-cli (default) | gitlab-cli
- --labels: Labels to apply in CLI examples (default: 'lint,tech-debt')
- --top-files: limit for hotspot lists (default: 10)
- --min-count: minimum occurrences to include in lists (default: 1)
- --max-examples: maximum examples/snippets per section (default: 5)

---

## scaffold

Create a starter external constants package for a given domain.

### Synopsis
```bash
npx eslint-plugin-ai-code-snifftest scaffold <domain> [--dir=./path]
```

### Example
```bash
npx eslint-plugin-ai-code-snifftest scaffold medical --dir=./examples/external/medical
```

---

## Environment variables

- SKIP_AI_REQUIREMENTS=1
  - Skip Node/ESLint version checks.
- FORCE_AI_CONFIG=1
  - Overwrite existing `.ai-coding-guide.json` when running `init`.
- FORCE_ESLINT_CONFIG=1
  - Overwrite existing `eslint.config.mjs` when running `init`.
- FORCE_CLI_INTERACTIVE=1
  - Force interactive wizard for `init` even when flags are provided.
- AI_DEBUG_INIT=1
  - Write `.ai-init-debug.json` with parsed flags, architecture decision, and file summary.

---

## Exit codes
- 0: Success
- 1: Failure (invalid usage, unmet requirements, or internal error)

---

## Notes & Changes
- `.ai-coding-guide.md` generation removed; use `AGENTS.md` for human‑readable guidance.
- `eslint.config.mjs` is generated as an ES module to avoid Node module‑type warnings.
- Architecture guardrails are enabled by default; disable with `--no-arch` or `--arch=false`.
- External constants discovery is enabled by default; opt out with `--no-external` or set `experimentalExternalConstants: false` in `.ai-coding-guide.json`.
