# Health Gating (Context-Aware Ratchet)

Purpose
- Enforce a minimum code health bar using context-aware telemetry (executable LOC density) while allowing controlled bypasses.
- Start non-blocking; promote to blocking only after burn-in and calibration.

How it works (current implementation)
- Health score computed from analysis JSON using violation density per 1K executable LOC (exLOC):
  - overall: all categories
  - structural: complexity + architecture
  - semantic: domain terms + magic numbers
- Score mapping: lower density → higher score (0–100).
- Gate compares selected score against threshold.

Configuration (.ai-coding-guide.json)
```json
{
  "ratchet": {
    "health": {
      "enabled": false,
      "gateOn": "overall",
      "minOverall": 70,
      "intentOverrides": {
        "refactoring": { "minOverall": 65 }
      },
      "bypass": {
        "label": "health-bypass",
        "commitToken": "[health-bypass]",
        "maxBypassPerPR": 1
      },
      "failureMessage": "Code health decreased below threshold. See telemetry output (intent, density, health)."
    }
  }
}
```
Notes
- gateOn supports: overall | structural | semantic.
- intent detection: CLI accepts --refactoring or --intent=refactoring (best-effort; extend later).
- bypass: commit messages containing the commitToken or env HEALTH_BYPASS=true will bypass; label reserved for future CI integration.

## Enable in CI

Option A: Scaffold workflow with the CLI
```bash
npx eslint-plugin-ai-code-snifftest init --ci
```
This creates `.github/workflows/ci-ratchet.yml` with a `ratchet-and-tests` job.

Option B: Reusable workflow (no files needed)
```yaml
name: ci-ratchet
on: [push, pull_request]
jobs:
  ratchet-and-tests:
    uses: mojoatomic/eslint-plugin-ai-code-snifftest/.github/workflows/ratchet-reusable.yml@main
    with:
      node-version: '20'
```

Branch protection (GitHub → Settings → Branches → main)
- Require status checks: `ratchet-and-tests`
- Optional: also require your test matrix job (e.g., `Test on Node.js 20.x`)

## Calibration (burn‑in → enforce)
1) Burn‑in: keep `health.enabled=false` and watch the reported scores in PRs.
2) Choose thresholds: set `gateOn` and `minOverall` based on observed ranges.
3) Flip the switch: set `health.enabled=true` to enforce. The CI job will fail if score < threshold.

Troubleshooting
- No lines.executable in analysis: health falls back to physical lines; check analyzer wiring.
- Unexpected gate failures: confirm thresholds, gateOn, and any intent override are set as intended; use a one-time bypass with the commit token for urgent fixes.

Failure message anatomy
- HEALTH-GATE FAIL: <message>
- gateOn, threshold, actual, intent printed for quick diagnosis
- Example suggestions printed by the ratchet script for common rules

## Health Score Calculation

### Formula
```javascript
// Per-category density (per 1K executable LOC)
density = violations / (executableLOC / 1000)

// Score mapping (inverse)
score = Math.max(0, 100 - (density * scaleFactor))
```

### Scale Factors (guidance)
```
structural: 5   // High weight (complexity, architecture)
semantic:   2   // Medium weight (naming, magic numbers)
overall:    3   // Balanced (all categories)
```

### Examples
```javascript
// Good code
executableLOC = 5000
violations.structural = 10
// density = 10 / 5 = 2.0; score (structural) = 90 ✅

// Poor code
executableLOC = 5000
violations.structural = 50
// density = 50 / 5 = 10.0; score (structural) = 50 ❌

// Refactoring intent (relaxed overall)
executableLOC = 5000
violations.structural = 30
// density = 30 / 5 = 6.0; overall score ~70 → PASS if refactoring threshold = 65
```

Note: current implementation uses a single scale factor; per-domain scale factors can be added later.

## Intent Detection (roadmap)
- Manual: `--intent=refactoring` or commit message tag `[intent:refactoring]`
- Heuristic (future): compare function counts/avg size and violation trends vs baseline to auto-detect refactoring/cleanup/aiGeneration.

Future improvements (tracked in #203)
- Gate on health deltas vs thresholds
- More robust intent detection
- Domain-aware weights (configurable scale factors)
- Bypass counting per PR (token and label)
