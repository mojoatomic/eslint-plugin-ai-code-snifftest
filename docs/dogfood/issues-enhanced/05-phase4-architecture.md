# [Phase 4] Architecture Polish

Ensure file/function/params limits are respected.

## Problem Statement
Architecture constraints in .ai-coding-guide.json (File Length Limits, Function Limits, feature-based organization) keep the code maintainable. Enforce these rules:
- File Length Limits: CLI 100, Commands 150, Utilities 200, Default 250
- Function Limits: length ≤50, complexity ≤10, depth ≤4, params ≤4, statements ≤30
- File Organization: feature-based directories; thin orchestrators (AGENTS.md “CLI Style”)

### Configured Domains
- dev-tools (primary)
- cli (additional)
- linting (additional)

## Summary
**52** violations found across **21** file(s).

**Priority:** Medium (architecture)

## Violations Breakdown

### By Rule
- `max-lines-per-function`: 20 occurrences
- `max-statements`: 13 occurrences
- `max-lines`: 9 occurrences
- `max-depth`: 9 occurrences
- `max-params`: 1 occurrences

## Top Files Affected
1. `lib/commands/learn/index.js`: 10 violations
   - Line 12: Async function 'learnInteractiveCommand' has too many lines (152). Maximum allowed is 50.
   - Line 12: Async function 'learnInteractiveCommand' has too many parameters (5). Maximum allowed is 4.
   - Line 12: Async function 'learnInteractiveCommand' has too many statements (116). Maximum allowed is 30.

2. `lib/commands/init/index.js`: 9 violations
   - Line 20: Function 'initCommand' has too many lines (94). Maximum allowed is 50.
   - Line 20: Function 'initCommand' has too many statements (48). Maximum allowed is 30.
   - Line 133: Async function 'initInteractiveCommand' has too many lines (109). Maximum allowed is 50.

3. `lib/rules/no-redundant-conditionals.js`: 5 violations
   - Line 31: Method 'create' has too many lines (451). Maximum allowed is 50.
   - Line 292: Method 'IfStatement' has too many lines (70). Maximum allowed is 50.
   - Line 331: File has too many lines (471). Maximum allowed is 250.

4. `lib/commands/create-issues/markdown.js`: 3 violations
   - Line 70: Function 'buildMarkdownSections' has too many lines (259). Maximum allowed is 50.
   - Line 70: Function 'buildMarkdownSections' has too many statements (179). Maximum allowed is 30.
   - Line 169: File has too many lines (394). Maximum allowed is 150.

5. `lib/commands/plan/roadmap.js`: 3 violations
   - Line 23: Function 'writeRoadmap' has too many lines (69). Maximum allowed is 50.
   - Line 35: Arrow function has too many lines (57). Maximum allowed is 50.
   - Line 35: Arrow function has too many statements (48). Maximum allowed is 30.

6. `lib/commands/analyze/reporter.js`: 2 violations
   - Line 6: Function 'writeAnalysisReport' has too many lines (119). Maximum allowed is 50.
   - Line 6: Function 'writeAnalysisReport' has too many statements (65). Maximum allowed is 30.

7. `lib/generators/agents-md.js`: 2 violations
   - Line 32: Function 'writeAgentsMd' has too many lines (75). Maximum allowed is 50.
   - Line 32: Function 'writeAgentsMd' has too many statements (62). Maximum allowed is 30.

8. `lib/rules/no-redundant-calculations.js`: 2 violations
   - Line 179: Method 'create' has too many lines (210). Maximum allowed is 50.
   - Line 385: File has too many lines (322). Maximum allowed is 250.

9. `lib/rules/no-unnecessary-abstraction.js`: 2 violations
   - Line 28: Method 'create' has too many lines (157). Maximum allowed is 50.
   - Line 185: Method 'Program:exit' has too many lines (61). Maximum allowed is 50.

10. `lib/rules/prefer-simpler-logic.js`: 2 violations
   - Line 44: Method 'create' has too many lines (121). Maximum allowed is 50.
   - Line 48: Method 'BinaryExpression' has too many lines (74). Maximum allowed is 50.

### Architecture Hotspots (top files)
- lib/commands/learn/index.js: 10
- lib/commands/init/index.js: 9
- lib/rules/no-redundant-conditionals.js: 5
- lib/commands/create-issues/markdown.js: 3
- lib/commands/plan/roadmap.js: 3
- lib/commands/analyze/reporter.js: 2
- lib/generators/agents-md.js: 2
- lib/rules/no-redundant-calculations.js: 2
- lib/rules/no-unnecessary-abstraction.js: 2
- lib/rules/prefer-simpler-logic.js: 2

### Examples
- bin/cli.js:20 max-statements → Function 'main' has too many statements (39). Maximum allowed is 30.

```js
const { checkRequirements } = require(path.join(__dirname, '..', 'lib', 'utils', 'requirements'));

function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
```

- lib/commands/analyze/reporter.js:6 max-lines-per-function → Function 'writeAnalysisReport' has too many lines (119). Maximum allowed is 50.

```js
const path = require('path');

function writeAnalysisReport(outPath, { categories, effort, returnString, topFiles = 10, minCount = 1, maxExamples = 5, cfg } = {}) {
  const lines = [];
  lines.push('# Analysis Report');
```

- lib/commands/analyze/reporter.js:6 max-statements → Function 'writeAnalysisReport' has too many statements (65). Maximum allowed is 30.

```js
const path = require('path');

function writeAnalysisReport(outPath, { categories, effort, returnString, topFiles = 10, minCount = 1, maxExamples = 5, cfg } = {}) {
  const lines = [];
  lines.push('# Analysis Report');
```

- lib/commands/create-issues/markdown.js:70 max-lines-per-function → Function 'buildMarkdownSections' has too many lines (259). Maximum allowed is 50.

```js
}

function buildMarkdownSections(cats, which /* 'magic'|'terms'|'complexity'|'architecture'|null */, { topFiles = 10, minCount = 1, maxExamples = 5, cfg, analysis } = {}) {
  const lines = [];
```

- lib/commands/create-issues/markdown.js:70 max-statements → Function 'buildMarkdownSections' has too many statements (179). Maximum allowed is 30.

```js
}

function buildMarkdownSections(cats, which /* 'magic'|'terms'|'complexity'|'architecture'|null */, { topFiles = 10, minCount = 1, maxExamples = 5, cfg, analysis } = {}) {
  const lines = [];
```

Suggested Fix: Split monolithic functions/files; enforce limits from .ai-coding-guide.json.

## Fix Strategy
- Split monolithic files into feature-focused modules (AGENTS.md “File Organization”)
- Thin orchestrators (CLI Style): keep routing in CLI; move work into submodules
- Enforce limits:
  - File length: adhere to per-type limits in .ai-coding-guide.json
  - Function limits: ≤50 lines, ≤30 statements, ≤10 complexity, ≤4 depth/params
- Extract helpers; flatten nested blocks (guard clauses)
- Prefer composition over deep branching

## Verification
```bash
npx eslint . --format json > lint-results.json
npx eslint-plugin-ai-code-snifftest analyze --input=lint-results.json
# Spot-check files with max-lines or max-statements in analysis-report.md
grep -E "max-lines|max-statements" -n analysis-report.md | head
npm test
```

## Success Criteria
- [ ] Violations reduced: 52 → 11 (or 0)
- [ ] Top 5 files addressed
- [ ] Tests green: npm test
- [ ] Patterns in AGENTS.md followed
