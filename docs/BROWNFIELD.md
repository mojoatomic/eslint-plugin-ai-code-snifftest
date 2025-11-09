# Brownfield Projects: Understanding Ratchet Progress During Refactors

Good refactors (monolith → atomic helpers) can increase raw violation counts while improving maintainability and testability.

How to approach
- Prioritize critical categories (complexity, architecture). Keep them flat/down.
- Temporarily tolerate minor-category increases (naming/domain terms) during refactors.
- Use context-aware ratchet to evaluate weighted score and density, not raw totals alone.

Workflow
1) Refactor
   - Break large functions into smaller helpers.
2) Measure
   - npm run lint:json && npm run analyze:current
   - npm run ratchet:context
3) Refresh baseline intentionally
   - npm run guardrails:baseline -- --refactoring --description="<short summary>"
   - Review REFACTORING-LOG.md entry in PR

Review checklist
- No increase in critical categories
- Weighted score did not increase (or refactor mode with acceptable tradeoffs)
- Structural breakdowns (max-lines-per-function, max-depth, complexity) trending down
