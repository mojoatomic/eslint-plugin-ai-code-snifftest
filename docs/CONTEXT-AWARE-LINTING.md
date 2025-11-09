# Context-Aware Linting: Beyond Violation Counting

Traditional static analysis counts violations; good refactors can increase counts while improving real quality. Context-aware ratchet aims to prevent quality degradation while allowing healthy refactors.

What changes in context-aware mode
- Critical vs minor policy
  - Critical (hard gate): complexity family, architecture limits
  - Minor (warn/relax during refactors): naming/domain terms, generic names
- Weighted score and violation density
  - Weighted score aggregates category importance
  - Density normalizes against LOC growth
- Refactoring mode
  - Allows minor-category increases when no critical regressions and structure improves
  - Appends REFACTORING-LOG.md entry
- Structural proxies
  - Prints rule-level breakdowns for complexity and architecture to aid review

Heuristic intent detection (report-only)
- Signals used:
  - criticalDown: total of complexity+architecture decreases
  - weightedDown: weighted score does not increase
  - densityDown: violations per 1k LOC does not increase
  - minorUp: domain-terms/generic-names increase (common during helper extraction)
- Confidence is derived from the number of positive signals (reported as a percentage).
- Intent is reported as one of: refactoring, ai-generation-suspect, neutral.
- Enforcement remains manual: pass --refactoring to relax minor increases.

Local comparison
- npm run ratchet:compare prints traditional and context-aware outputs side-by-side to help calibration.

Usage
- Enable in config (optional):
  {
    "ratchet": {
      "mode": "context-aware",
      "weights": { "complexity": 10, "architecture": 8, "domainTerms": 2, "magicNumbers": 1 },
      "critical": ["complexity", "architecture"],
      "minor": ["domainTerms", "magicNumbers"],
      "allowMinorIncreaseDuringRefactor": true
    }
  }
- Run context-aware ratchet:
  npm run ratchet:context
- Refresh baseline after refactor (logs change):
  npm run guardrails:baseline -- --refactoring --description="Broke <X> into atomic helpers"

Notes
- Traditional ratchet remains available via npm run ratchet
- CI can continue using traditional until context-aware is calibrated
