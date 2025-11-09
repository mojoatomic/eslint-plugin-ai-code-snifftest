# Context-Aware Linting and Telemetry

This codebase supports a context-aware ratchet that understands refactoring intent and reports a composite Code Health score (telemetry). The traditional ratchet remains the merge gate.

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
1) Burn‑in: keep telemetry job non‑blocking for a few PRs; review reported signals and health deltas in CI.
2) Branch protection: mark the telemetry job (ratchet-context) as “required” in repository settings; optionally remove continue-on-error.
3) (Optional) Health gating: after calibration, enable policy to block when overall health decreases. This can be added as a future enhancement (tracked in issue) and controlled via config (e.g., ratchet.health.gate with minDelta).

Notes
- Support scripts under scripts/**/*.js are excluded from complexity/architecture and plugin-complexity rules, keeping product metrics accurate.
- Traditional ratchet continues to gate merges; context-aware telemetry complements it by providing richer signals.
