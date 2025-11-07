# FIXES Roadmap

## Summary
- Total complexity: 88
- Total architecture: 52
- Total domain terms: 74
- Total magic numbers: 0

## Phase 1: Quick Wins
Items: 0

### Tasks
- [ ] Run auto-fix: npx eslint --fix .  (est ~5-10m)  — fixes ~166 issues
- [ ] Re-run analysis to update counts

### Success Metrics
- Auto-fix reduced violations by ~166

## Phase 2: Domain Cleanup
Items: 74

### Tasks
- [ ] Tidy ai-code-snifftest/no-generic-names (top 74)
### Top Files
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/tests/lib/generators/eslint-arch-config.test.js: 12
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/tests/integration/cli-learn-interactive-snapshot.test.js: 6
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/tests/lib/utils/arch-defaults.test.js: 6
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-calculations.js: 5
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-conditionals.js: 4

### Success Metrics
- Domain-term rule counts reduced by 80%

## Phase 3: Refactoring
Items: 50

### Tasks
- [ ] Reduce complexity (top 54)
- [ ] Reduce ai-code-snifftest/prefer-simpler-logic (top 25)
- [ ] Reduce ai-code-snifftest/no-redundant-conditionals (top 9)
### Top Files
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-conditionals.js: 39
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-calculations.js: 6
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/scanner/reconcile.js: 3
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/docs/sample-rule-no-redundant-calculations.js: 2
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/init/index.js: 2

### Success Metrics
- Complexity rule counts below thresholds

## Phase 4: Polish
Items: 52

### Tasks
- [ ] Tidy max-lines-per-function (top 20)
- [ ] Tidy max-statements (top 13)
- [ ] Tidy max-lines (top 9)
- [ ] Tidy max-depth (top 9)
- [ ] Tidy max-params (top 1)
### Top Files
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/learn/index.js: 10
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/init/index.js: 9
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/rules/no-redundant-conditionals.js: 5
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/create-issues/markdown.js: 3
- /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest/lib/commands/plan/roadmap.js: 3

### Success Metrics
- Architecture rule counts within configured limits

