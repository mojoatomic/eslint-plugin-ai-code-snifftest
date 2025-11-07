# Analysis Report

Errors: 6  Warnings: 354  Auto-fixable: 166

## Categories
- Magic numbers: 0
- Complexity: 88
- Domain terms: 74
- Architecture: 52

## Top Domains
- dev-tools: 0
- cli: 0
- linting: 0

### Domain Hints
- biology: 76
- graphics: 60
- photo: 32
- cs: 22
- finance: 8

## Complexity (88)
### By rule
- complexity: 54
- ai-code-snifftest/prefer-simpler-logic: 25
- ai-code-snifftest/no-redundant-conditionals: 9

### Top files
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-conditionals.js: 39
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-calculations.js: 6
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/scanner/reconcile.js: 3
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/docs/sample-rule-no-redundant-calculations.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/init/index.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/learn/index.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/enforce-domain-terms.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-unnecessary-abstraction.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/scanner/extract.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/utils/project-config.js: 2

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

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/analyze/reporter.js:7 max-lines-per-function → Function 'writeAnalysisReport' has too many lines (122). Maximum allowed is 50.

```js
const { getDomainHints } = require('./domain');

function writeAnalysisReport(outPath, { categories, effort, returnString, topFiles = 10, minCount = 1, maxExamples = 5, cfg } = {}) {
  const lines = [];
  lines.push('# Analysis Report');
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/analyze/reporter.js:7 max-statements → Function 'writeAnalysisReport' has too many statements (66). Maximum allowed is 30.

```js
const { getDomainHints } = require('./domain');

function writeAnalysisReport(outPath, { categories, effort, returnString, topFiles = 10, minCount = 1, maxExamples = 5, cfg } = {}) {
  const lines = [];
  lines.push('# Analysis Report');
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/create-issues/markdown.js:62 max-lines-per-function → Function 'buildMarkdownSections' has too many lines (124). Maximum allowed is 50.

```js
}

function buildMarkdownSections(cats, which /* 'magic'|'terms'|'complexity'|'architecture'|null */, { topFiles = 10, minCount = 1, maxExamples = 5, cfg } = {}) {
  const lines = [];
  const ds = Array.isArray(cats.domainSummary) ? cats.domainSummary.slice(0, 5) : [];
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/create-issues/markdown.js:62 max-statements → Function 'buildMarkdownSections' has too many statements (99). Maximum allowed is 30.

```js
}

function buildMarkdownSections(cats, which /* 'magic'|'terms'|'complexity'|'architecture'|null */, { topFiles = 10, minCount = 1, maxExamples = 5, cfg } = {}) {
  const lines = [];
  const ds = Array.isArray(cats.domainSummary) ? cats.domainSummary.slice(0, 5) : [];
```


## Domain terms (74)
### By rule
- ai-code-snifftest/no-generic-names: 74

### Top files
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/tests/lib/generators/eslint-arch-config.test.js: 12
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/tests/integration/cli-learn-interactive-snapshot.test.js: 6
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/tests/lib/utils/arch-defaults.test.js: 6
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-calculations.js: 5
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-conditionals.js: 4
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/prefer-simpler-logic.js: 4
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/scanner/reconcile.js: 4
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/tests/integration/cli-init-arch-guardrails.test.js: 4
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/tests/integration/cli-init-multi-domains.test.js: 3
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/create-issues/markdown.js: 2

### Examples
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/docs/sample-rule-no-redundant-calculations.js:154 ai-code-snifftest/no-generic-names → Generic name "result" - use a domain-specific term

```js

        // Evaluate the expression
        const result = evaluateTree(node);

        if (result === null) {
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/create-issues/markdown.js:140 ai-code-snifftest/no-generic-names → Generic name "list" - use a domain-specific term

```js
      lines.push('');
    }
    const list = (cats.complexity || []).slice(0, Math.min(5, maxExamples || 5));
    if (list.length) {
      lines.push('### Examples');
```

- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/create-issues/markdown.js:166 ai-code-snifftest/no-generic-names → Generic name "list" - use a domain-specific term

```js
      lines.push('');
    }
    const list = (cats.architecture || []).slice(0, Math.min(5, maxExamples || 5));
    if (list.length) {
      lines.push('### Examples');
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


## Magic numbers (0)
## Effort (rough estimate)
- Hours: 129.5
- Days: 16.2
- Weeks: 3.2

### Effort by category (hours)
- Complexity: 113.2
- Architecture: 10.4
- Domain terms: 5.9
- Magic numbers: 0

## Prioritization (impact × effort heuristic)
- Complexity: count=88, est=113.2h
- Domain terms: count=74, est=5.9h
- Architecture: count=52, est=10.4h
- Magic numbers: count=0, est=0h

Note: Domains are constrained to your configuration (domains.primary/additional).
