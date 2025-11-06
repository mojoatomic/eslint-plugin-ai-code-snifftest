# eslint-plugin-ai-code-snifftest

ESLint plugin with AI agent configuration generator for JavaScript projects.

**Validation:** Dogfooded on own codebase (769-line CLI → 50 lines, 338 violations detected)  
**Method:** Static analysis + project-specific configuration generation  
**Use Cases:** JavaScript/Node.js projects using AI coding assistants (Claude, Cursor, Copilot)

---

## What This Provides

This plugin combines two functions:

1. **ESLint rules** - 8 rules targeting AI-generated code patterns
2. **Configuration generator** - CLI tool that creates AI agent guides and ESLint configs

### Generated Files

Running `init` creates:

| File | Purpose | Size |
|------|---------|------|
| `.ai-coding-guide.json` | Machine-readable configuration | ~100 lines |
| `AGENTS.md` | AI agent coding reference | ~200 lines |
| `.cursorrules` | Cursor editor integration | ~50 lines |
| `eslint.config.js` | ESLint configuration with architecture rules | ~150 lines |

---

## Installation

### Requirements
- Node.js 18+
- ESLint 9+

See docs/MINIMUM_REQUIREMENTS.md for version compatibility.
```sh
npm i eslint --save-dev
npm install eslint-plugin-ai-code-snifftest --save-dev
```

---

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
  --md --cursor --eslint
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

🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).  
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

| Name | Description | 🔧 | 💡 |
| :--- | :---------- | :- | :- |
| [enforce-domain-terms](docs/rules/enforce-domain-terms.md) | Encourage domain-specific naming using declared project terms | | 💡 |
| [enforce-naming-conventions](docs/rules/enforce-naming-conventions.md) | Enforce naming conventions from project config (style, boolean/async prefixes, plural collections) | | 💡 |
| [no-equivalent-branches](docs/rules/no-equivalent-branches.md) | Detect if/else branches that do the same thing | 🔧 | |
| [no-generic-names](docs/rules/no-generic-names.md) | Flag generic names; enforce domain-specific naming | | |
| [no-redundant-calculations](docs/rules/no-redundant-calculations.md) | Detect redundant calculations that should be computed at compile time | 🔧 | 💡 |
| [no-redundant-conditionals](docs/rules/no-redundant-conditionals.md) | Simplify redundant conditional expressions | 🔧 | |
| [no-unnecessary-abstraction](docs/rules/no-unnecessary-abstraction.md) | Suggest inlining trivial single-use wrapper functions that add no value | | 💡 |
| [prefer-simpler-logic](docs/rules/prefer-simpler-logic.md) | Simplify boolean expressions and remove redundant logic | 🔧 | |

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

When enabled, adds these rules to `eslint.config.js`:

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
// eslint.config.js
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
Module type of file:///...eslint.config.js is not specified
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

## External Constants (Experimental)

Optional feature for discovering domain-specific constants from npm packages.

**Enable:**
```bash
npx eslint-plugin-ai-code-snifftest init --external
```

Or in `.ai-coding-guide.json`:
```json
{
  "experimentalExternalConstants": true,
  "externalConstantsAllowlist": ["^@ai-constants/"]
}
```

**Status:** Experimental, disabled by default

**Limitations:**
- Requires specific npm package structure
- Discovery cache may need manual clearing
- Not all domain packages supported

---

## License

[Your License]

## Contributing

[Contribution guidelines]

---

**Note:** This documentation describes capabilities validated through self-testing. Results may vary based on project structure, codebase patterns, and AI assistant behavior.
