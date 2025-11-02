# Implementation Checklist (Estimated 15–20 hours)

- Phase 1: Pre‑flight checks (2–3h)
  - Detect Node >=18 (hard exit)
  - Detect ESLint >=9 (hard exit)
  - Detect React/Vue/Next and warn
- Phase 2: AGENTS.md generator (4–5h)
  - Condensed cross‑tool content
  - Coexist with WARP.md (never modify)
- Phase 3: Wizard updates (3–4h)
  - Interactive prompts; --yes; flags (--agents --md --cursor --json --eslint --all)
- Phase 4: Documentation (2–3h)
  - README Warp integration + Migration v2
  - Strategy docs
- Phase 5: Testing (4–5h)
  - Integration tests for domain resolution and CLI flows