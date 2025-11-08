# [Phase 1] Fix Magic Numbers

Replace repeated numeric literals with named constants.

### Configured Domains
- dev-tools (primary)
- cli (additional)
- linting (additional)

## Summary
0 violations in this category.

## Fix Strategy
- Extract repeated numeric literals into named constants.
- Centralize common units/time/geometry values.

## Verification
```bash
npx eslint . --format json > lint-results.json
npx eslint-plugin-ai-code-snifftest analyze --input=lint-results.json
```

## Acceptance Criteria
- [ ] Violations reduced: 0 → 0 (or 0)
- [ ] Top 5 files addressed
- [ ] Tests green: npm test
- [ ] Patterns in AGENTS.md followed
