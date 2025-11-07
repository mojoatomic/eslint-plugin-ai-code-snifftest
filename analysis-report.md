# Analysis Report

Errors: 5  Warnings: 346  Auto-fixable: 166

## Categories
- Magic numbers: 0
- Complexity: 86
- Domain terms: 71
- Architecture: 52

## Top Domains
- dev-tools: 0
- cli: 0
- linting: 0

## Complexity (86)
### By rule
- complexity: 52
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
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/docs/sample-rule-no-redundant-calculations.js:17 complexity → Function 'evaluateExpression' has a complexity of 11. Maximum allowed is 10.
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/docs/sample-rule-no-redundant-calculations.js:71 complexity → Function 'evaluateTree' has a complexity of 11. Maximum allowed is 10.
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/analyze/categorizer.js:8 complexity → Function 'categorizeViolations' has a complexity of 27. Maximum allowed is 10.
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/analyze/domain.js:28 complexity → Function 'inferDomainForMessage' has a complexity of 12. Maximum allowed is 10.

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
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/analyze/reporter.js:5 max-lines-per-function → Function 'writeAnalysisReport' has too many lines (90). Maximum allowed is 50.
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/analyze/reporter.js:5 max-statements → Function 'writeAnalysisReport' has too many statements (58). Maximum allowed is 30.
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/create-issues/markdown.js:32 max-lines-per-function → Function 'buildMarkdownSections' has too many lines (69). Maximum allowed is 50.
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/create-issues/markdown.js:32 max-statements → Function 'buildMarkdownSections' has too many statements (55). Maximum allowed is 30.

## Domain terms (71)
### By rule
- ai-code-snifftest/no-generic-names: 71

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
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/constants/index.js:52 ai-code-snifftest/no-generic-names → Generic name "arr" - use a domain-specific term
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/constants/index.js:63 ai-code-snifftest/no-generic-names → Generic name "arr" - use a domain-specific term
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-calculations.js:318 ai-code-snifftest/no-generic-names → Generic name "item" - use a domain-specific term
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-calculations.js:358 ai-code-snifftest/no-generic-names → Generic name "arr" - use a domain-specific term

## Magic numbers (0)
## Effort (rough estimate)
- Hours: 139.9
- Days: 17.5
- Weeks: 3.5

### Effort by category (hours)
- Complexity: 129
- Architecture: 5.2
- Domain terms: 5.7
- Magic numbers: 0

## Prioritization (impact × effort heuristic)
- Complexity: count=86, est=129h
- Domain terms: count=71, est=5.7h
- Architecture: count=52, est=5.2h
- Magic numbers: count=0, est=0h

Note: Domains are constrained to your configuration (domains.primary/additional).
