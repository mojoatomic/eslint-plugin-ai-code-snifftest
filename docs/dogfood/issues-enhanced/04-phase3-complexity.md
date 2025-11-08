# [Phase 3] Reduce Complexity

Refactor complex functions and simplify logic.

## Problem Statement
High cyclomatic complexity increases defects and slows change. From AGENTS.md:
- Function Limits: max complexity 10, max statements 30, max length 50, max depth 4
- CLI Style: keep entry points thin (orchestration shells)
- Error Handling: explicit, not nested
- Async Style: prefer async/await for clarity

### Configured Domains
- dev-tools (primary)
- cli (additional)
- linting (additional)

## Summary
**91** violations found across **36** file(s).

**Priority:** High (complexity)

## Violations Breakdown

### By Rule
- `complexity`: 57 occurrences
- `ai-code-snifftest/prefer-simpler-logic`: 25 occurrences
- `ai-code-snifftest/no-redundant-conditionals`: 9 occurrences

## Top Files Affected
1. `lib/rules/no-redundant-conditionals.js`: 39 violations
   - Line 41: Function 'isConstant' has a complexity of 12. Maximum allowed is 10.
   - Line 73: Function 'getBooleanValue' has a complexity of 16. Maximum allowed is 10.
   - Line 119: Function 'isRedundantBooleanComparison' has a complexity of 34. Maximum allowed is 10.

2. `lib/rules/no-redundant-calculations.js`: 6 violations
   - Line 100: Function 'evaluateTree' has a complexity of 15. Maximum allowed is 10.
   - Line 256: Function 'shouldSkipScientificCalculation' has a complexity of 18. Maximum allowed is 10.
   - Line 311: Function 'buildEffectiveConstantsMap' has a complexity of 19. Maximum allowed is 10.

3. `lib/commands/create-issues/markdown.js`: 4 violations
   - Line 70: Function 'buildMarkdownSections' has a complexity of 85. Maximum allowed is 10.
   - Line 102: Function 'pickList' has a complexity of 13. Maximum allowed is 10.
   - Line 113: Arrow function has a complexity of 13. Maximum allowed is 10.

4. `lib/scanner/reconcile.js`: 3 violations
   - Line 24: Function 'reconcileNaming' has a complexity of 15. Maximum allowed is 10.
   - Line 70: Function 'reconcileConstants' has a complexity of 25. Maximum allowed is 10.
   - Line 128: Function 'reconcile' has a complexity of 11. Maximum allowed is 10.

5. `docs/sample-rule-no-redundant-calculations.js`: 2 violations
   - Line 17: Function 'evaluateExpression' has a complexity of 11. Maximum allowed is 10.
   - Line 71: Function 'evaluateTree' has a complexity of 11. Maximum allowed is 10.

6. `lib/commands/init/index.js`: 2 violations
   - Line 20: Function 'initCommand' has a complexity of 40. Maximum allowed is 10.
   - Line 133: Async function 'initInteractiveCommand' has a complexity of 46. Maximum allowed is 10.

7. `lib/commands/learn/index.js`: 2 violations
   - Line 12: Async function 'learnInteractiveCommand' has a complexity of 69. Maximum allowed is 10.
   - Line 188: Function 'learnCommand' has a complexity of 22. Maximum allowed is 10.

8. `lib/rules/enforce-domain-terms.js`: 2 violations
   - Line 29: Function 'collectDomainTerms' has a complexity of 29. Maximum allowed is 10.
   - Line 59: Function 'collectExemptions' has a complexity of 13. Maximum allowed is 10.

9. `lib/rules/no-unnecessary-abstraction.js`: 2 violations
   - Line 42: Function 'getTrivialWrapperInfo' has a complexity of 13. Maximum allowed is 10.
   - Line 185: Method 'Program:exit' has a complexity of 11. Maximum allowed is 10.

10. `lib/scanner/extract.js`: 2 violations
   - Line 10: Function 'walk' has a complexity of 14. Maximum allowed is 10.
   - Line 135: Function 'aggregateSummaries' has a complexity of 17. Maximum allowed is 10.

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

## Fix Strategy
- Enforce “Function Limits” (AGENTS.md): break up functions >50 lines or >30 statements; target complexity ≤10
- CLI Style: move business logic out of entry points (shell orchestrates, commands do work)
- Strategy/lookup maps over branching chains (AGENTS.md “Code Patterns”)
- Remove redundant conditionals (see rule `ai-code-snifftest/no-redundant-conditionals`)
- Prefer early returns to reduce nesting depth (≤4)
- Async/await consistently (AGENTS.md “Async Style”)

## Verification
```bash
npx eslint . --format json > lint-results.json
npx eslint-plugin-ai-code-snifftest analyze --input=lint-results.json
# sanity check by file
grep -n "no-redundant-conditionals.js" analysis-report.md | head
npm test
```

## Success Criteria
- [ ] Violations reduced: 91 → 19 (or 0)
- [ ] Top 5 files addressed
- [ ] Tests green: npm test
- [ ] Patterns in AGENTS.md followed
