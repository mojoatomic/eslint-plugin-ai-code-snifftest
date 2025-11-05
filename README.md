# eslint-plugin-ai-code-snifftest

Does your AI-generated code pass the sniff test? Detect and fix AI code smell.

## Installation

### Requirements
- Node.js 18+
- ESLint 9+

See docs/MINIMUM_REQUIREMENTS.md for details.

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-ai-code-snifftest`:

```sh
npm install eslint-plugin-ai-code-snifftest --save-dev
```

## Usage

### Learn Workflow

The `learn` command analyzes your codebase and helps reconcile patterns to improve code quality:

```bash
# Interactive mode (recommended for first-time setup)
eslint-plugin-ai-code-snifftest learn --interactive

# Non-interactive with auto-apply
eslint-plugin-ai-code-snifftest learn --apply --fingerprint
```

**What it does:**
- Scans your codebase for naming patterns, constants, and generic names
- Reconciles findings with sane defaults
- Provides interactive review for constants with domain-aware suggestions
- Generates `.ai-constants/project-fingerprint.js` with validated constants

**Fingerprint consumption:**
When you run `init`, it automatically consumes the fingerprint:
- Merges discovered constants into `.ai-coding-guide.json`
- Adds mapped domains to `domains.additional`
- Seeds `constantResolution` mappings

**Example workflow:**
```bash
# 1. Analyze your codebase
eslint-plugin-ai-code-snifftest learn --interactive --sample=300

# 2. Initialize config (consumes fingerprint)
eslint-plugin-ai-code-snifftest init --primary=astronomy

# 3. The init command merges fingerprint data automatically
```

See [docs/learn.md](docs/learn.md) for detailed documentation.

### ESLint Configuration

In your [configuration file](https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file), import the plugin `eslint-plugin-ai-code-snifftest` and add `ai-code-snifftest` to the `plugins` key:

```js
import { defineConfig } from "eslint/config";
import ai-code-snifftest from "eslint-plugin-ai-code-snifftest";

export default defineConfig([
    {
        plugins: {
            ai-code-snifftest
        }
    }
]);
```



## Rules

<!-- begin auto-generated rules list -->

🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).\
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

| Name                                                                   | Description                                                                                        | 🔧 | 💡 |
| :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- | :- | :- |
| [enforce-domain-terms](docs/rules/enforce-domain-terms.md)             | Encourage domain-specific naming using declared project terms                                      |    | 💡 |
| [enforce-naming-conventions](docs/rules/enforce-naming-conventions.md) | Enforce naming conventions from project config (style, boolean/async prefixes, plural collections) |    | 💡 |
| [no-equivalent-branches](docs/rules/no-equivalent-branches.md)         | Detect if/else branches that do the same thing                                                     | 🔧 |    |
| [no-generic-names](docs/rules/no-generic-names.md)                     | Flag generic names; enforce domain-specific naming                                                 |    |    |
| [no-redundant-calculations](docs/rules/no-redundant-calculations.md)   | Detect redundant calculations that should be computed at compile time                              | 🔧 | 💡 |
| [no-redundant-conditionals](docs/rules/no-redundant-conditionals.md)   | Simplify redundant conditional expressions                                                         | 🔧 |    |
| [no-unnecessary-abstraction](docs/rules/no-unnecessary-abstraction.md) | Suggest inlining trivial single-use wrapper functions that add no value                            |    | 💡 |
| [prefer-simpler-logic](docs/rules/prefer-simpler-logic.md)             | Simplify boolean expressions and remove redundant logic                                            | 🔧 |    |

<!-- end auto-generated rules list -->

## Usage with Prettier

This plugin is **fully compatible with Prettier**. Our auto-fixes focus on logical simplification (not formatting), so they work seamlessly with Prettier's formatting.

### Recommended Workflow

Run ESLint before Prettier for best results:

```json
{
  "scripts": {
    "lint": "eslint --fix . && prettier --write .",
    "lint:check": "eslint . && prettier --check ."
  }
}
```

### Integrated Setup (Alternative)

For a seamless experience, use `eslint-plugin-prettier` to run both tools together:

```bash
npm install --save-dev eslint-plugin-prettier eslint-config-prettier prettier
```

```javascript
// eslint.config.js
import prettier from 'eslint-plugin-prettier';
import aiSnifftest from 'eslint-plugin-ai-code-snifftest';

export default [
  {
    plugins: {
      'ai-code-snifftest': aiSnifftest,
    },
    rules: {
      'ai-code-snifftest/no-redundant-calculations': 'error',
      'ai-code-snifftest/no-equivalent-branches': 'error',
      'ai-code-snifftest/prefer-simpler-logic': 'error',
      'ai-code-snifftest/no-redundant-conditionals': 'error',
      'ai-code-snifftest/no-unnecessary-abstraction': 'warn',
    },
  },
  prettier.configs.recommended,  // Prettier runs after our rules
];
```

Now a single command handles both:

```bash
eslint --fix .  # Fixes logic AND formats code
```

### How It Works

Our plugin focuses on **logical simplification** (`type: 'suggestion'`), not formatting (`type: 'layout'`). 

ESLint automatically applies fixes in this order:
1. **Problem rules** (bugs)
2. **Suggestion rules** ← Our plugin fixes logic here
3. **Layout rules** (whitespace) ← Prettier formats here

This ensures no conflicts! ✅

**Verified:** All rules tested with Prettier 3.x compatibility suite (18 integration tests).

## Architecture Guardrails

Enforce code quality guardrails for file/function complexity to guide AI-generated code toward maintainable patterns.

### Quick Start

Enable during interactive init:

```bash
eslint-plugin-ai-code-snifftest init
# Answer 'Y' when prompted for architectural guardrails
```

### What It Does

Adds an `architecture` section to `.ai-coding-guide.json` with configurable limits:

```json
{
  "architecture": {
    "fileStructure": {
      "pattern": "feature-based"
    },
    "maxFileLength": {
      "cli": 100,
      "command": 150,
      "util": 200,
      "generator": 250,
      "component": 300,
      "default": 250
    },
    "functions": {
      "maxLength": 50,
      "maxComplexity": 10,
      "maxDepth": 4,
      "maxParams": 4,
      "maxStatements": 30
    },
    "patterns": {
      "cliStyle": "orchestration-shell",
      "errorHandling": "explicit",
      "asyncStyle": "async-await"
    }
  }
}
```

### Generated ESLint Rules

When enabled, `eslint.config.js` includes:

**Global rules:**
- `max-lines`: Warn at 250 lines (configurable per file type)
- `max-lines-per-function`: Warn at 50 lines
- `complexity`: Warn at cyclomatic complexity 10
- `max-depth`: Warn at nesting depth 4
- `max-params`: Warn at 4 parameters
- `max-statements`: Warn at 30 statements

**Per-path overrides:**
- CLI files (`bin/*.js`): **Error** at 100 lines (strict)
- Commands: Warn at 150 lines
- Utils: Warn at 200 lines
- Generators: Warn at 250 lines
- Components: Warn at 300 lines
- Tests: Complexity/statements limits **disabled**

### Customization

**Interactive:**
```bash
eslint-plugin-ai-code-snifftest init
# Answer 'y' to "Customize thresholds?"
```

**Manual (`.ai-coding-guide.json`):**
```json
{
  "architecture": {
    "maxFileLength": {
      "cli": 80,
      "default": 300
    },
    "functions": {
      "maxComplexity": 15
    }
  }
}
```

### Benefits

- **AI-friendly constraints**: Guide AI toward modular, testable code
- **Incremental adoption**: Warnings (not errors) for most rules
- **Context-aware**: Different limits for different file types
- **Test-friendly**: Lenient rules for test files

## Troubleshooting

### ESLint Config Issues

**Module type warning:**
```
Module type of file:///...eslint.config.js is not specified
```
**Solution**: Add `"type": "module"` to your `package.json`

**`no-undef` errors for Node.js globals:**
```
error  'require' is not defined  no-undef
error  'process' is not defined  no-undef
```
**Solution**: Generated config already includes Node.js globals. If using a custom config, add:
```js
import globals from 'globals';

export default [{
  languageOptions: {
    globals: { ...globals.node }
  }
}];
```

**Syntax errors in generated config:**

This was a known issue (fixed in v0.0.1+). Update to the latest version:
```bash
npm update eslint-plugin-ai-code-snifftest
```

### Architecture Guardrails

**Duplicate rule keys:**

If you see errors like `Duplicate key 'complexity'`, this was fixed in v0.0.1+. The generator now skips overlapping AI-friendly rules when architecture guardrails are enabled.

**Generated config issues:**

To regenerate the config:
```bash
FORCE_ESLINT_CONFIG=1 eslint-plugin-ai-code-snifftest init
```

## Configurations

See RFC: Extensible Domain Constants via Plugin Architecture (#64).

### Migration to v2 (Multi-domain)

#### Warp Integration
Our wizard generates `AGENTS.md` which Warp reads automatically. We do not modify `WARP.md` (owned by Warp).

Setup:
1. Initialize Warp: `warp /init`
2. Initialize linting: `npx eslint-plugin-ai-code-snifftest init --md --cursor --agents`
3. Done — Warp reads AGENTS.md alongside WARP.md.
See docs/migration/v2.md for details. For new projects, use the CLI wizard:

```bash
eslint-plugin-ai-code-snifftest init --primary=astronomy --additional=geometry,math,units --md --cursor
```

<!-- begin auto-generated configs list -->
TODO: Run eslint-doc-generator to generate the configs list (or delete this section if no configs are offered).
<!-- end auto-generated configs list -->

### External constants (experimental)
- Enable in CLI: `--external` or set `experimentalExternalConstants: true` in `.ai-coding-guide.json`.
- Wizard will summarize discovered domains (built-in, npm, local, custom) and list merged domains in `.ai-coding-guide.md`.
- Behind a flag; defaults to disabled.

#### Allowlist and cache
- `externalConstantsAllowlist`: array of package names or regex strings (e.g., `"^@ai-constants/"`) to limit npm discovery.
- CLI: `--allowlist="^@ai-constants/med,^eslint-constants-"` seeds the allowlist in generated config when used with `--external`.
- Env:
  - `DEBUG_AI_CONSTANTS=1` prints discovery warnings
  - `AI_CONSTANTS_NO_CACHE=1` disables the in-process discovery cache
- Enable in CLI: `--external` or set `experimentalExternalConstants: true` in `.ai-coding-guide.json`.
- Wizard will summarize discovered domains (built-in, npm, local, custom) and list merged domains in `.ai-coding-guide.md`.
- Behind a flag; defaults to disabled.

