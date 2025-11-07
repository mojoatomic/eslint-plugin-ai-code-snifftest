# [Phase 1] Auto-fix Sweep

Run ESLint auto-fix to resolve straightforward issues (quotes, formatting, etc.).

```bash
npx eslint --fix .
```


### Detected Domains
- dev-tools: 0
- cli: 0
- linting: 0

### Domain Hints
- biology: 76
- graphics: 60
- photo: 32
- cs: 22
- finance: 8

### Terminology to Review
- unknown
- Generic name "result" - use a domain-specific term
- Generic name "list" - use a domain-specific term
- Generic name "list" - use a domain-specific term
- Generic name "arr" - use a domain-specific term
- Generic name "arr" - use a domain-specific term

### Examples
- result → (domain-specific)

```js

        // Evaluate the expression
        const result = evaluateTree(node);

        if (result === null) {
```

- list → (domain-specific)

```js
      lines.push('');
    }
    const list = (cats.complexity || []).slice(0, Math.min(5, maxExamples || 5));
    if (list.length) {
      lines.push('### Examples');
```

- list → (domain-specific)

```js
      lines.push('');
    }
    const list = (cats.architecture || []).slice(0, Math.min(5, maxExamples || 5));
    if (list.length) {
      lines.push('### Examples');
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

### Complexity Hotspots (top files)
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

### Architecture Hotspots (top files)
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

### Acceptance Criteria
- [ ] Named constants exist for top recurring numeric values
- [ ] Domain terminology aligns with catalog (and project conventions)
- [ ] Complexity hotspots have clear refactor plans
- [ ] Architecture limits are respected
