# [Phase 3] Reduce Complexity

Refactor complex functions and simplify logic.

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

### Acceptance Criteria
- [ ] Named constants exist for top recurring numeric values
- [ ] Domain terminology aligns with catalog (and project conventions)
- [ ] Complexity hotspots have clear refactor plans
- [ ] Architecture limits are respected
