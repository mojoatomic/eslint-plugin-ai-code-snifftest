# [Phase 1] Auto-fix Sweep

Run ESLint auto-fix to resolve straightforward issues (quotes, formatting, etc.).

```bash
npx eslint --fix .
```


### Detected Domains
- dev-tools: 0
- cli: 0
- linting: 0

### Terminology to Review
- unknown
- Generic name "result" - use a domain-specific term
- Generic name "arr" - use a domain-specific term
- Generic name "arr" - use a domain-specific term
- Generic name "item" - use a domain-specific term
- Generic name "arr" - use a domain-specific term

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

### Acceptance Criteria
- [ ] Named constants exist for top recurring numeric values
- [ ] Domain terminology aligns with catalog (and project conventions)
- [ ] Complexity hotspots have clear refactor plans
- [ ] Architecture limits are respected
