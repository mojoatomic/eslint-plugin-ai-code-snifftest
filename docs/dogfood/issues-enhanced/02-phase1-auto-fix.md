# [Phase 1] Auto-fix Sweep

Run ESLint auto-fix to resolve straightforward issues (quotes, formatting, etc.).

```bash
npx eslint --fix .
```

## Problem Statement

Before targeted refactors, apply safe, automated fixes to reduce noise and stabilize the codebase. This aligns with AGENTS.md:
- Anti-Patterns: “Generic names,” “Magic numbers,” “Monolithic files” become clearer once trivial issues are fixed.
- Code Patterns: Keep CLI as an orchestration shell (“CLI Style”), use explicit error handling and async/await consistently.
- Function Limits: Max length 50, complexity 10, depth 4, params 4, statements 30 — auto-fix prepares for subsequent phases to meet these limits.

### Configured Domains
- dev-tools (primary)
- cli (additional)
- linting (additional)

## Summary
**215** violations found across **64** file(s).

**Priority:** Low (all)

## Violations Breakdown

### By Rule
- `ai-code-snifftest/no-generic-names`: 72 occurrences
- `complexity`: 57 occurrences
- `ai-code-snifftest/prefer-simpler-logic`: 25 occurrences
- `max-lines-per-function`: 20 occurrences
- `max-statements`: 13 occurrences

### By Generic Name
- `tmp`: 28 occurrences
- `result`: 25 occurrences → ruleResult, validationResult, parseResult
- `value`: 8 occurrences
- `arr`: 5 occurrences → violations, rules, constants
- `data`: 3 occurrences → ruleData, configData, parserData

### Examples
- result → (domain-specific)

```js

        // Evaluate the expression
        const result = evaluateTree(node);

        if (result === null) {
```

- arr → (domain-specific)

```js
    for (const r of list) {
      const k = rel(r.filePath);
      const arr = m.get(k) || [];
      arr.push(r);
      m.set(k, arr);
```

- arr → (domain-specific)

```js
  const out = [];
  for (const [domain, mod] of Object.entries(DOMAINS)) {
    const arr = Array.isArray(mod.constants) ? mod.constants : [];
    for (const v of arr) {
      if (typeof v === 'number') out.push({ domain, value: v });
```

- arr → (domain-specific)

```js
  const out = [];
  for (const [domain, mod] of Object.entries(DOMAINS)) {
    const arr = Array.isArray(mod.terms) ? mod.terms : [];
    for (const t of arr) {
      out.push({ domain, term: String(t) });
```

- item → (domain-specific)

```js
          if (!Array.isArray(arr)) continue;
          const set = new Set();
          for (const item of arr) {
            const v = normalizeNumber(item);
            if (v !== null) set.add(v);
```

## Top Files Affected
1. `lib/rules/no-redundant-conditionals.js`: 48 violations
   - Line 297: Generic name "value" - use a domain-specific term
   - Line 379: Generic name "value" - use a domain-specific term
   - Line 402: Generic name "value" - use a domain-specific term

2. `lib/rules/no-redundant-calculations.js`: 12 violations
   - Line 318: Generic name "item" - use a domain-specific term
   - Line 358: Generic name "arr" - use a domain-specific term
   - Line 360: Generic name "item" - use a domain-specific term

3. `tests/lib/generators/eslint-arch-config.test.js`: 12 violations
   - Line 11: Generic name "result" - use a domain-specific term
   - Line 18: Generic name "result" - use a domain-specific term
   - Line 30: Generic name "result" - use a domain-specific term

4. `lib/commands/learn/index.js`: 12 violations
   - Line 12: Async function 'learnInteractiveCommand' has a complexity of 69. Maximum allowed is 10.
   - Line 188: Function 'learnCommand' has a complexity of 22. Maximum allowed is 10.
   - Line 12: Async function 'learnInteractiveCommand' has too many lines (152). Maximum allowed is 50.

5. `lib/commands/init/index.js`: 11 violations
   - Line 20: Function 'initCommand' has a complexity of 40. Maximum allowed is 10.
   - Line 133: Async function 'initInteractiveCommand' has a complexity of 46. Maximum allowed is 10.
   - Line 20: Function 'initCommand' has too many lines (94). Maximum allowed is 50.

6. `lib/commands/create-issues/markdown.js`: 8 violations
   - Line 242: Generic name "arr" - use a domain-specific term
   - Line 70: Function 'buildMarkdownSections' has a complexity of 85. Maximum allowed is 10.
   - Line 102: Function 'pickList' has a complexity of 13. Maximum allowed is 10.

7. `lib/rules/prefer-simpler-logic.js`: 7 violations
   - Line 53: Generic name "value" - use a domain-specific term
   - Line 70: Generic name "value" - use a domain-specific term
   - Line 92: Generic name "value" - use a domain-specific term

8. `lib/scanner/reconcile.js`: 7 violations
   - Line 29: Generic name "result" - use a domain-specific term
   - Line 57: Generic name "arr" - use a domain-specific term
   - Line 118: Generic name "bool" - use a domain-specific term

9. `tests/integration/cli-learn-interactive-snapshot.test.js`: 6 violations
   - Line 69: Generic name "tmp" - use a domain-specific term
   - Line 106: Generic name "result" - use a domain-specific term
   - Line 137: Generic name "tmp" - use a domain-specific term

10. `tests/lib/utils/arch-defaults.test.js`: 6 violations
   - Line 36: Generic name "result" - use a domain-specific term
   - Line 53: Generic name "result" - use a domain-specific term
   - Line 66: Generic name "result" - use a domain-specific term

### Complexity Hotspots (top files)
- lib/rules/no-redundant-conditionals.js: 39
- lib/rules/no-redundant-calculations.js: 6
- lib/commands/create-issues/markdown.js: 4
- lib/scanner/reconcile.js: 3
- docs/sample-rule-no-redundant-calculations.js: 2
- lib/commands/init/index.js: 2
- lib/commands/learn/index.js: 2
- lib/rules/enforce-domain-terms.js: 2
- lib/rules/no-unnecessary-abstraction.js: 2
- lib/scanner/extract.js: 2

### Examples
- bin/cli.js:20 complexity → Function 'main' has a complexity of 16. Maximum allowed is 10.

```js
const { checkRequirements } = require(path.join(__dirname, '..', 'lib', 'utils', 'requirements'));

function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
```

- docs/sample-rule-no-redundant-calculations.js:17 complexity → Function 'evaluateExpression' has a complexity of 11. Maximum allowed is 10.

```js
 * @returns {number|null} - The evaluated result or null if cannot evaluate
 */
function evaluateExpression(node) {
  // Only evaluate if both sides are literals
  if (node.left.type !== 'Literal' || node.right.type !== 'Literal') {
```

- docs/sample-rule-no-redundant-calculations.js:71 complexity → Function 'evaluateTree' has a complexity of 11. Maximum allowed is 10.

```js
 * @returns {number|null} - The evaluated result
 */
function evaluateTree(node) {
  if (node.type === 'Literal') {
    return node.value;
```

- lib/commands/analyze/categorizer.js:8 complexity → Function 'categorizeViolations' has a complexity of 27. Maximum allowed is 10.

```js
}

function categorizeViolations(eslintJson /* array */, cfg) {
  const out = {
    magicNumbers: [],
```

- lib/commands/analyze/domain.js:28 complexity → Function 'inferDomainForMessage' has a complexity of 12. Maximum allowed is 10.

```js
}

function inferDomainForMessage(message, domainData) {
  if (!message) return null;
  const msg = String(message);
```

Suggested Fix: Extract helpers, use guard clauses, and prefer a command map to reduce branching.

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

Phase-appropriate, automated first:
1) Auto-fix sweep
   - Run: `npx eslint --fix .`
   - Re-run until no more easy wins (idempotent).
2) Naming harmonization (pre-work for Phase 2)
   - For `result`, use dev-tools-friendly terms: ruleResult, validationResult, parseResult (AGENTS.md “Anti-Patterns”, “Naming”).
   - For `arr`, prefer violations, rules, constants (clarity per “File Organization” and “Naming”).
3) Prepare for complexity/architecture phases
   - Use “CLI Style” to keep entry points thin (orchestration shell).
   - Extract helpers from long functions; apply early returns (AGENTS.md “Function Limits”, “Anti-Patterns”).
   - Avoid deep nesting (>4) and large files (>250 lines default; see “File Length Limits”).

## Verification
```bash
# Recreate analysis after auto-fix
npx eslint . --format json > lint-results.json
npx eslint-plugin-ai-code-snifftest analyze --input=lint-results.json

# Quick checks
grep -E "^Errors:|^## Categories" analysis-report.md
npm test
```

## Success Criteria
- [ ] Violations reduced: 215 → 43 (or 0)
- [ ] Top 5 files addressed
- [ ] Tests green: npm test
- [ ] Patterns in AGENTS.md followed
