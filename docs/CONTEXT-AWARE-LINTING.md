# Context-Aware Linting and Telemetry

This codebase supports a context-aware ratchet that understands refactoring intent and reports a composite Code Health score (telemetry). The traditional ratchet remains the merge gate.

See also: EXECUTABLE-LINES.md (exLOC metrics) and HEALTH-GATING.md (configuration and behavior).

What you get
- Intent signals: refactoring / ai-generation-suspect / neutral (with confidence)
- Structural proxies: per-rule breakdowns for complexity and architecture
- Code Health score (0–100): overall + components (structural, semantic, maintainability, style)
- Non-blocking telemetry by default (recommended burn‑in period)

How to run locally
- Traditional ratchet (merge gate):
  npm run ratchet
- Context-aware telemetry (one of these will work depending on script availability):
  npm run ratchet:context
  # or fallback if the script isn’t present yet
  node scripts/ratchet.js --mode=context --baseline=analysis-baseline.json --current=analysis-current.json

Configuration (optional)
- Weights and categories in .ai-coding-guide.json (used in telemetry):
  {
    "ratchet": {
      "weights": { "complexity": 10, "architecture": 8, "domainTerms": 2, "magicNumbers": 1 },
      "critical": ["complexity", "architecture"],
      "minor": ["domainTerms", "magicNumbers"],
      "allowMinorIncreaseDuringRefactor": true
    }
  }

Promoting telemetry to a required PR check
- Prefer enabling health gating (see HEALTH-GATING.md) via the `ratchet-and-tests` job.
- Burn‑in: keep `health.enabled=false`, review telemetry; then flip to true and require the job in branch protection.
- Use `init --ci` or the reusable workflow to wire CI quickly.

Notes
- Support scripts under scripts/**/*.js are excluded from complexity/architecture and plugin-complexity rules, keeping product metrics accurate.
- Traditional ratchet continues to gate merges; context-aware telemetry complements it by providing richer signals.
