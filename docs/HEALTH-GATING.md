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

CI recommendation
- Keep the context-aware step non-blocking during burn-in; monitor health scores in PRs.
- Once calibrated, flip health.enabled to true and remove continue-on-error; mark the job required in branch protection.

Troubleshooting
- No lines.executable in analysis: health falls back to physical lines; check analyzer wiring.
- Unexpected gate failures: confirm thresholds, gateOn, and any intent override are set as intended; use a one-time bypass with the commit token for urgent fixes.

Future improvements (tracked in #203)
- Gate on health deltas vs thresholds
- More robust intent detection
- Domain-aware weights
- Bypass counting per PR (token and label)
