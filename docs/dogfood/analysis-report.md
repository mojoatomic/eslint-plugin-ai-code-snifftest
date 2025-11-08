# Analysis Report

Errors: 6  Warnings: 355  Auto-fixable: 166

## Categories
- Magic numbers: 0
- Complexity: 91
- Domain terms: 72
- Architecture: 52

## Configured Domains
- dev-tools (primary)
- cli (additional)
- linting (additional)

### Domain term violations
- Total: 72
- See AGENTS.md for project terminology.

## Complexity (91)
### By rule
- complexity: 57
- ai-code-snifftest/prefer-simpler-logic: 25
- ai-code-snifftest/no-redundant-conditionals: 9

### Top files
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-conditionals.js: 39
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-calculations.js: 6
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/create-issues/markdown.js: 4
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/scanner/reconcile.js: 3
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/docs/sample-rule-no-redundant-calculations.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/init/index.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/learn/index.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/enforce-domain-terms.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-unnecessary-abstraction.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/scanner/extract.js: 2

### Examples
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/bin/cli.js:20 complexity → Function 'main' has a complexity of 16. Maximum allowed is 10.

```js
const { checkRequirements } = require(path.join(__dirname, '..', 'lib', 'utils', 'requirements'));

function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/docs/sample-rule-no-redundant-calculations.js:17 complexity → Function 'evaluateExpression' has a complexity of 11. Maximum allowed is 10.

```js
 * @returns {number|null} - The evaluated result or null if cannot evaluate
 */
function evaluateExpression(node) {
  // Only evaluate if both sides are literals
  if (node.left.type !== 'Literal' || node.right.type !== 'Literal') {
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/docs/sample-rule-no-redundant-calculations.js:71 complexity → Function 'evaluateTree' has a complexity of 11. Maximum allowed is 10.

```js
 * @returns {number|null} - The evaluated result
 */
function evaluateTree(node) {
  if (node.type === 'Literal') {
    return node.value;
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/analyze/categorizer.js:8 complexity → Function 'categorizeViolations' has a complexity of 27. Maximum allowed is 10.

```js
}

function categorizeViolations(eslintJson /* array */, cfg) {
  const out = {
    magicNumbers: [],
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/analyze/domain.js:28 complexity → Function 'inferDomainForMessage' has a complexity of 12. Maximum allowed is 10.

```js
}

function inferDomainForMessage(message, domainData) {
  if (!message) return null;
  const msg = String(message);
```


## Architecture (52)
### By rule
- max-lines-per-function: 20
- max-statements: 13
- max-lines: 9
- max-depth: 9
- max-params: 1

### Top files
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/learn/index.js: 10
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/init/index.js: 9
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-conditionals.js: 5
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/create-issues/markdown.js: 3
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/plan/roadmap.js: 3
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/analyze/reporter.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/generators/agents-md.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-calculations.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-unnecessary-abstraction.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/prefer-simpler-logic.js: 2

### Examples
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/bin/cli.js:20 max-statements → Function 'main' has too many statements (39). Maximum allowed is 30.

```js
const { checkRequirements } = require(path.join(__dirname, '..', 'lib', 'utils', 'requirements'));

function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/analyze/reporter.js:6 max-lines-per-function → Function 'writeAnalysisReport' has too many lines (119). Maximum allowed is 50.

```js
const path = require('path');

function writeAnalysisReport(outPath, { categories, effort, returnString, topFiles = 10, minCount = 1, maxExamples = 5, cfg } = {}) {
  const lines = [];
  lines.push('# Analysis Report');
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/analyze/reporter.js:6 max-statements → Function 'writeAnalysisReport' has too many statements (65). Maximum allowed is 30.

```js
const path = require('path');

function writeAnalysisReport(outPath, { categories, effort, returnString, topFiles = 10, minCount = 1, maxExamples = 5, cfg } = {}) {
  const lines = [];
  lines.push('# Analysis Report');
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/create-issues/markdown.js:70 max-lines-per-function → Function 'buildMarkdownSections' has too many lines (259). Maximum allowed is 50.

```js
}

function buildMarkdownSections(cats, which /* 'magic'|'terms'|'complexity'|'architecture'|null */, { topFiles = 10, minCount = 1, maxExamples = 5, cfg, analysis } = {}) {
  const lines = [];

```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/create-issues/markdown.js:70 max-statements → Function 'buildMarkdownSections' has too many statements (179). Maximum allowed is 30.

```js
}

function buildMarkdownSections(cats, which /* 'magic'|'terms'|'complexity'|'architecture'|null */, { topFiles = 10, minCount = 1, maxExamples = 5, cfg, analysis } = {}) {
  const lines = [];

```


## Domain terms (72)
### By rule
- ai-code-snifftest/no-generic-names: 72

### Top files
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/tests/lib/generators/eslint-arch-config.test.js: 12
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/tests/integration/cli-learn-interactive-snapshot.test.js: 6
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/tests/lib/utils/arch-defaults.test.js: 6
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-calculations.js: 4
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-conditionals.js: 4
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/prefer-simpler-logic.js: 4
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/scanner/reconcile.js: 4
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/tests/integration/cli-init-arch-guardrails.test.js: 4
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/tests/integration/cli-init-multi-domains.test.js: 3
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/constants/index.js: 2

### Examples
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/docs/sample-rule-no-redundant-calculations.js:154 ai-code-snifftest/no-generic-names → Generic name "result" - use a domain-specific term

```js

        // Evaluate the expression
        const result = evaluateTree(node);

        if (result === null) {
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/create-issues/markdown.js:242 ai-code-snifftest/no-generic-names → Generic name "arr" - use a domain-specific term

```js
    for (const r of list) {
      const k = rel(r.filePath);
      const arr = m.get(k) || [];
      arr.push(r);
      m.set(k, arr);
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/constants/index.js:52 ai-code-snifftest/no-generic-names → Generic name "arr" - use a domain-specific term

```js
  const out = [];
  for (const [domain, mod] of Object.entries(DOMAINS)) {
    const arr = Array.isArray(mod.constants) ? mod.constants : [];
    for (const v of arr) {
      if (typeof v === 'number') out.push({ domain, value: v });
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/constants/index.js:63 ai-code-snifftest/no-generic-names → Generic name "arr" - use a domain-specific term

```js
  const out = [];
  for (const [domain, mod] of Object.entries(DOMAINS)) {
    const arr = Array.isArray(mod.terms) ? mod.terms : [];
    for (const t of arr) {
      out.push({ domain, term: String(t) });
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-calculations.js:318 ai-code-snifftest/no-generic-names → Generic name "item" - use a domain-specific term

```js
          if (!Array.isArray(arr)) continue;
          const set = new Set();
          for (const item of arr) {
            const v = normalizeNumber(item);
            if (v !== null) set.add(v);
```


## Magic numbers (0)
## Effort (rough estimate)
- Hours: 133.9
- Days: 16.7
- Weeks: 3.3

### Effort by category (hours)
- Complexity: 117.7
- Architecture: 10.4
- Domain terms: 5.8
- Magic numbers: 0

## Prioritization (impact × effort heuristic)
- Complexity: count=91, est=117.7h
- Domain terms: count=72, est=5.8h
- Architecture: count=52, est=10.4h
- Magic numbers: count=0, est=0h

Note: Domains are constrained to your configuration (domains.primary/additional).
