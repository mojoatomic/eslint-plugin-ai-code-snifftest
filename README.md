# eslint-plugin-ai-code-snifftest

ESLint plugin with AI agent configuration generator for JavaScript projects.

**Validation:** Dogfooded on own codebase (769-line CLI → 50 lines, 338 violations detected)  
**Method:** Static analysis + project-specific configuration generation  
**Use Cases:** JavaScript/Node.js projects using AI coding assistants (Claude, Cursor, Copilot)

---

## What This Provides

This plugin combines two functions and built-in guardrails:

1. **ESLint rules** - 8 rules targeting AI-generated code patterns
2. **Configuration generator** - CLI tool that creates AI agent guides and ESLint configs
3. **Guardrails: No-New-Debt Ratchet** — hooks + CI that block increases in analyzer categories. See [No-New-Debt Ratchet (All projects)](#no-new-debt-ratchet-all-projects)

### Generated Files

Running `init` creates:

| File | Purpose | Size |
|------|---------|------|
| `.ai-coding-guide.json` | Machine-readable configuration | ~100 lines |
| `AGENTS.md` | AI agent coding reference | ~200 lines |
| `.cursorrules` | Cursor editor integration | ~50 lines |
| `eslint.config.mjs` | ESLint configuration with architecture rules | ~150 lines |

---

## Installation

### CI-safe setup (recommended)

Add scripts to your package.json:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:ci": "eslint . || true",
    "lint:json": "eslint . -f json -o lint-results.json",
    "analyze:current": "eslint-plugin-ai-code-snifftest analyze --input=lint-results.json --format=json --output=analysis-current.json",
    "ratchet": "eslint-plugin-ai-code-snifftest ratchet"
  }
}
```

GitHub Actions example:

```yaml
- name: Lint (non-blocking)
  run: npm run lint:ci
- name: Ratchet (blocks on regression)
  run: npm run ci:ratchet
```

### Requirements
- Node.js 18+
- ESLint 9+

See docs/MINIMUM_REQUIREMENTS.md for version compatibility.
```sh
npm i eslint --save-dev
npm install eslint-plugin-ai-code-snifftest --save-dev
```

---

## CLI Reference

See full command and flag reference in [docs/CLI.md](docs/CLI.md).

## Quick Start (2 Minutes)

### Option 0: One-Command Setup (Recommended)
```bash
npx eslint-plugin-ai-code-snifftest setup --yes
```

### Option 1: Analyze Your Code First
```bash
# Step 1: Analyze your codebase
npx eslint-plugin-ai-code-snifftest learn --interactive

# Step 2: Generate configuration files
npx eslint-plugin-ai-code-snifftest init

# Step 3: Start linting!
npx eslint .
```

### Option 2: Specify Your Domain Manually
```bash
# One command setup
npx eslint-plugin-ai-code-snifftest init \
  --primary=web-app \
  --yes

# Start linting!
npx eslint .
```

### What You Get

After setup, you'll have:
- ✅ AGENTS.md - AI coding guidelines (read by Warp, Cursor, Claude)
- ✅ .ai-coding-guide.json - Project configuration
- ✅ eslint.config.mjs - ESLint rules with architecture guardrails

### Next Steps

- Review `AGENTS.md` for coding guidelines
- Run `npx eslint .` to check your code
- Enable the No‑New‑Debt Ratchet to prevent regressions (see section below)
- Use AI assistants (they'll automatically read AGENTS.md)

## Quick Start

### Option 1: Interactive Setup
```bash
npx eslint-plugin-ai-code-snifftest init

# Prompts for:
# - Primary domain (e.g., web-app, cli, data-science)
# - Additional domains (optional)
# - File generation preferences
```

### Option 2: Non-Interactive
```bash
npx eslint-plugin-ai-code-snifftest init \
  --primary=web-app \
  --additional=react,api \
  --cursor
```

### Option 3: Learn-First Approach
```bash
# Analyze existing codebase patterns
npx eslint-plugin-ai-code-snifftest learn --interactive

# Generate config based on detected patterns
npx eslint-plugin-ai-code-snifftest init --primary=auto
```

---

## Validation

We tested this tool on its own codebase during a refactoring effort.

### Test Parameters
- **Codebase:** This plugin's source code
- **Task:** Refactor 769-line CLI file
- **Method:** Used generated AGENTS.md and architecture guardrails

### Results
- **CLI file:** 769 lines → 50 lines (93% reduction)
- **Violations detected:** 338 (10 errors, 328 warnings)
- **Auto-fixable:** 242 violations (72%)
- **CLI complexity:** 1 warning (down from multiple violations)

### Findings

**Learn command:**
- Score: 44/100
- Naming detection: 97% accuracy (4,836 camelCase detected)
- Generic name detection: 8 terms flagged correctly

**Init command:**
- Generated AGENTS.md with correct domain configuration
- Created architecture section with file/function limits
- ESLint config properly integrated

**Lint results:**
- Plugin rules detected real issues (prefer-simpler-logic: 27, no-redundant-conditionals: 10)
- Architecture rules caught limit violations (complexity: 44, max-lines: 8)
- Quote style violations: 204 (auto-fixed)

See [DOGFOOD_RESULTS.md](./docs/DOGFOOD_RESULTS.md) for complete analysis.

## See It In Action (Dogfooding)

This project uses itself to manage tech debt. See real results:

### Analysis Results
- [analysis-report.md](./docs/dogfood/analysis-report.md) - 360 violations analyzed in 8 minutes
- [FIXES-ROADMAP.md](./docs/dogfood/FIXES-ROADMAP.md) - 4-phase remediation plan
- [analysis.json](./docs/dogfood/analysis.json) - Structured data

### Enhanced GitHub Issues
See [docs/dogfood/issues-enhanced/](./docs/dogfood/issues-enhanced/) for 5 production-ready issues:
1. [Phase 1: Auto-fix](./docs/dogfood/issues-enhanced/02-phase1-auto-fix.md) - 215 violations, 10 min effort
2. [Phase 2: Domain Terms](./docs/dogfood/issues-enhanced/03-phase2-domain-terms.md) - 72 violations, 5.8 hours
3. [Phase 3: Complexity](./docs/dogfood/issues-enhanced/04-phase3-complexity.md) - 91 violations, 117 hours
4. [Phase 4: Architecture](./docs/dogfood/issues-enhanced/05-phase4-architecture.md) - 52 violations, 10.4 hours

Each issue includes:
- Problem statement (WHY it matters)
- AGENTS.md pattern references
- Specific fix strategies (result → ruleResult)
- Top 10 files with line numbers
- Code examples from violations
- Verification commands

### Compare: Before and After AI Enhancement
- **Before** (tool output): [docs/dogfood/issues/](./docs/dogfood/issues/)
- **After** (AI enhanced): [docs/dogfood/issues-enhanced/](./docs/dogfood/issues-enhanced/)

See the difference AI makes in adding domain intelligence!

### How Issues Were Enhanced
See [ULTIMATE-ISSUE-PROMPT.md](./docs/ULTIMATE-ISSUE-PROMPT.md) for the AI prompt that transformed rich markdown into perfect, domain-aware GitHub issues.

**This is what you get when you use this tool.** ✨

```
├── docs/
│   ├── dogfood/
│   │   ├── analysis-report.md
│   │   ├── FIXES-ROADMAP.md
│   │   ├── analysis.json
│   │   ├── issues/              # Tool output
│   │   └── issues-enhanced/     # AI enhanced
│   └── ULTIMATE-ISSUE-PROMPT.md
```

---

## Migration Notes

See docs/MIGRATION.md for changes in defaults and new commands.

---

## Learn Workflow

The `learn` command analyzes your codebase to detect patterns:
```bash
# Interactive mode with code sampling
npx eslint-plugin-ai-code-snifftest learn --interactive --sample=300
```

**Detection capabilities:**
- Naming patterns (camelCase, snake_case, PascalCase detection)
- Generic variable names
- Boolean prefix patterns
- Async function patterns

**Limitations:**
- Sample-based analysis (may miss patterns in unsampled files)
- Requires minimum codebase size for pattern detection
- Generic name detection threshold: 0.6 confidence minimum

**Output:**
- `.ai-coding-guide.json` updated with detected patterns
- `learn-report.json` with detailed findings
- Optional: `.ai-constants/project-fingerprint.js`

See [docs/learn.md](docs/learn.md) for methodology details.

---

## ESLint Rules

<!-- begin auto-generated rules list -->

⚠️ Configurations set to warn in.\
🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).\
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

| Name                                                                   | Description                                                                                        | ⚠️                          | 🔧 | 💡 |
| :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- | :-------------------------- | :- | :- |
| [enforce-domain-terms](docs/rules/enforce-domain-terms.md)             | Encourage domain-specific naming using declared project terms                                      | ![badge-permissive-start][] |    | 💡 |
| [enforce-naming-conventions](docs/rules/enforce-naming-conventions.md) | Enforce naming conventions from project config (style, boolean/async prefixes, plural collections) |                             |    | 💡 |
| [no-equivalent-branches](docs/rules/no-equivalent-branches.md)         | Detect if/else branches that do the same thing                                                     | ![badge-permissive-start][] | 🔧 |    |
| [no-generic-names](docs/rules/no-generic-names.md)                     | Flag generic names; enforce domain-specific naming                                                 | ![badge-permissive-start][] |    |    |
| [no-redundant-calculations](docs/rules/no-redundant-calculations.md)   | Detect redundant calculations that should be computed at compile time                              | ![badge-permissive-start][] | 🔧 | 💡 |
| [no-redundant-conditionals](docs/rules/no-redundant-conditionals.md)   | Simplify redundant conditional expressions                                                         | ![badge-permissive-start][] | 🔧 |    |
| [no-unnecessary-abstraction](docs/rules/no-unnecessary-abstraction.md) | Suggest inlining trivial single-use wrapper functions that add no value                            | ![badge-permissive-start][] |    | 💡 |
| [prefer-simpler-logic](docs/rules/prefer-simpler-logic.md)             | Simplify boolean expressions and remove redundant logic                                            | ![badge-permissive-start][] | 🔧 |    |

<!-- end auto-generated rules list -->

---

## Architecture Guardrails

Optional feature that enforces file and function complexity limits.

### Configuration

Enabled via `init` command or by adding to `.ai-coding-guide.json`:
```json
{
  "architecture": {
    "maxFileLength": {
      "cli": 100,
      "command": 150,
      "util": 200,
      "default": 250
    },
    "functions": {
      "maxLength": 50,
      "maxComplexity": 10,
      "maxDepth": 4,
      "maxParams": 4,
      "maxStatements": 30
    }
  }
}
```

### Generated ESLint Rules

When enabled, adds these rules to `eslint.config.mjs`:

**Global (warnings):**
- `max-lines`: 250 lines per file
- `max-lines-per-function`: 50 lines
- `complexity`: Cyclomatic complexity ≤10
- `max-depth`: Nesting depth ≤4
- `max-params`: Function parameters ≤4
- `max-statements`: Statements per function ≤30

**Path-specific (errors):**
- CLI files (`bin/*.js`): 100 lines maximum
- Command files: 150 lines maximum
- Test files: Complexity/statement limits disabled

### Limitations

- Limits are suggestions, not enforced by language/runtime
- May require adjustment for specific project needs
- Test files excluded from most limits

---

## AI Agent Integration

Generated files are consumed by AI coding assistants:

### Supported Tools

| Tool | Integration Method | File Read |
|------|-------------------|-----------|
| Warp | Automatic | `AGENTS.md` |
| Cursor | Automatic | `.cursorrules` |
| Claude Desktop | Manual reference | `AGENTS.md` |
| GitHub Copilot | Manual reference | `AGENTS.md` |
| Other AI assistants | Manual reference | `AGENTS.md` |

### What AI Agents Receive

From `AGENTS.md`:
- Project domain context
- File length limits by type
- Function complexity limits
- Naming conventions
- Code pattern examples (good vs. problematic)
- Architecture preferences

### Limitations

- AI agents may not always follow guidelines
- Effectiveness depends on AI model and integration method
- Manual reference tools require explicit prompting
- No enforcement mechanism for AI compliance

---

## Compatibility

### Prettier

This plugin is compatible with Prettier. Auto-fixes focus on logical simplification (not formatting).

**Recommended workflow:**
```bash
eslint --fix .    # Logical fixes
prettier --write . # Formatting
```

**Or use integrated setup:**
```javascript
// eslint.config.mjs
import prettier from 'eslint-plugin-prettier';
import aiSnifftest from 'eslint-plugin-ai-code-snifftest';

export default [
  {
    plugins: { 'ai-code-snifftest': aiSnifftest },
    rules: {
      'ai-code-snifftest/no-redundant-calculations': 'error',
      'ai-code-snifftest/prefer-simpler-logic': 'error',
    },
  },
  prettier.configs.recommended,
];
```

Verified with Prettier 3.x compatibility suite (18 integration tests).

---

## Troubleshooting

### Module Type Warning
```
Module type of file:///...eslint.config.mjs is not specified
```

**Solution:** Add `"type": "module"` to `package.json`

### No-undef Errors for Node.js Globals
```
error  'require' is not defined  no-undef
error  'process' is not defined  no-undef
```

**Solution:** Generated config includes Node.js globals. For custom configs:
```js
import globals from 'globals';

export default [{
  languageOptions: {
    globals: { ...globals.node }
  }
}];
```

### Duplicate Rule Keys

Fixed in v0.0.1+. Update to latest version:
```bash
npm update eslint-plugin-ai-code-snifftest
```

### Regenerate Configuration
```bash
FORCE_ESLINT_CONFIG=1 npx eslint-plugin-ai-code-snifftest init
```

### JSON ESLint output (machine-readable)
- Preferred: `npm run lint:json` → writes `lint-results.json`
- Alternate: `npm run lint:js -- --format json -o lint-results.json`
- Note: the aggregator `npm run lint` uses npm-run-all and does not forward CLI flags to sub-scripts.
- Analyze JSON: `npx eslint-plugin-ai-code-snifftest analyze --input=lint-results.json`

### Architecture guardrails missing
If `eslint.config.mjs` doesn’t include “Architecture guardrails” or test files aren’t exempted:

1) Generate a debug snapshot
```bash
AI_DEBUG_INIT=1 npx eslint-plugin-ai-code-snifftest init --yes --eslint
# or
npx eslint-plugin-ai-code-snifftest init --yes --eslint --debug
```

2) Inspect `.ai-init-debug.json` in your project root. It includes:
- args: parsed CLI flags (e.g., `--no-arch`, `--arch=false`, `--yes`, `--eslint`)
- enableArch: whether architecture was enabled
- cfgHasArchitecture: whether architecture config was added
- files.eslintConfig: path to generated config
- files.eslintHasGuardrails: whether guardrail rules were written
- files.agentsHasArchitectureSection: whether `AGENTS.md` includes the section

3) Share `.ai-init-debug.json` in your GitHub issue if you need help (it contains no secrets).

Tip: Add `.ai-init-debug.json` to `.gitignore` (this repo does).

---

## Limitations

This tool is designed for JavaScript/Node.js projects and is currently in active development.

**Not suitable for:**
- TypeScript projects (limited support)
- Projects using ESLint <9.0
- Languages other than JavaScript
- Projects requiring JSDoc-based type checking
- Projects with custom ESLint plugin conflicts

**Known limitations:**
- Learn command requires minimum codebase size for pattern detection
- Generic name detection may have false positives in domain-specific contexts
- Architecture limits are suggestions only, not runtime-enforced
- AI agent compliance not guaranteed

---

## No-New-Debt Ratchet (All projects)

Keep quality trending in one direction only: better. The ratchet blocks any increase in analyzer categories (complexity, architecture, domain terms, magic numbers) while allowing gradual cleanup.

Why this matters (works for greenfield and brownfield)
- New templates often ship with violations; accept the baseline once, then prevent regressions
- Rapid prototyping: iterate fast without blocking, but never get worse than the last accepted state
- AI-generated and copied code: capture current count as baseline; fix over time

How it works in this repo
- Baseline file: analysis-baseline.json
- Local hook: pre-push runs `npm run lint:json && npm run analyze:current && npm run ratchet && npm test`
- CI: .github/workflows/ci-ratchet.yml runs the same and uploads artifacts

Usage
```bash
# Create/refresh baseline from current state (intend to accept current count)
npm run lint:json && npm run analyze:baseline

# Check current branch against baseline (runs in hooks/CI)
npm run lint:json && npm run analyze:current && npm run ratchet

# After reducing violations, refresh baseline intentionally
npm run lint:json && npm run analyze:baseline
# Commit the updated baseline (recommended message):
# 'ratchet: refresh baseline after reductions'
```

Modes for different project types
- Zero-Tolerance (pure greenfield)
  - Keep baseline at 0; optionally promote key rules to error in CI-only config
- Flexible Greenfield (prototype mode)
  - Set baseline from current state (e.g., template/prototype); prevent increases; ratchet down as you fix
- Brownfield (existing code)
  - Set baseline from current codebase; prevent increases; reduce over time; optionally use path-specific overrides for legacy areas

Adopting ratchet in other repos
- Manual setup today: copy scripts/ratchet.js, add the npm scripts shown above, wire a pre-push hook, and add a CI job similar to ci-ratchet
- Coming soon: a one-shot "guardrails setup" command to scaffold these pieces automatically (see issue #180)

---

## Developing (Self-hosting guardrails)

For contributors to this repo (self-hosting the plugin): running our rule fixers on the plugin’s own rule sources can mutate rule implementations. We added guardrails and documented a safe workflow — see docs/DEVELOPING.md.

## External Constants

Built-in feature for discovering domain-specific constants from npm packages.

**Disable (opt-out):**
```bash
npx eslint-plugin-ai-code-snifftest init --no-external
```

Or in `.ai-coding-guide.json`:
```json
{
"experimentalExternalConstants": true, // default
  "externalConstantsAllowlist": ["^@ai-constants/"]
}
```

**Status:** Enabled by default; use `--no-external` or set `experimentalExternalConstants: false` to opt out

**Limitations:**
- Requires specific npm package structure
- Discovery cache may need manual clearing
- Not all domain packages supported

---

## License

[Your License]

## Contributing

[Contribution guidelines]

### Deterministic rule tests (injecting settings)

Rule tests should not depend on the repository's `.ai-coding-guide.json`. The plugin resolves configuration with this precedence:

1. RuleTester settings (`context.settings['ai-code-snifftest']`)
2. Environment variable `AI_SNIFFTEST_CONFIG_JSON` (JSON string)
3. Disk `.ai-coding-guide.json`

Inject settings per test or suite to make behavior deterministic:

```js
// Example: dual suites for a rule
const RuleTester = require('eslint').RuleTester;
const rule = require('../lib/rules/your-rule');
const tester = new RuleTester({ languageOptions: { ecmaVersion: 2021, sourceType: 'module' } });

(function extConstOn(){
  const inject = (tc) => ({ ...tc, settings: { 'ai-code-snifftest': { experimentalExternalConstants: true } } });
  tester.run('your-rule [extConst=true]', rule, {
    valid: [ inject({ code: '/* ... */' }) ],
    invalid: [ inject({ code: '/* ... */', errors: [{ messageId: '...' }] }) ]
  });
})();

(function extConstOff(){
  const inject = (tc) => ({ ...tc, settings: { 'ai-code-snifftest': { experimentalExternalConstants: false } } });
  tester.run('your-rule [extConst=false]', rule, {
    valid: [ /* deterministic cases */ ],
    invalid: [ inject({ code: '/* ... */', errors: [{ messageId: '...' }] }) ]
  });
})();
```

For integration tests, you can set an environment override instead of per-test settings:

```bash
export AI_SNIFFTEST_CONFIG_JSON='{"experimentalExternalConstants":false}'
```

---

**Note:** This documentation describes capabilities validated through self-testing. Results may vary based on project structure, codebase patterns, and AI assistant behavior.
