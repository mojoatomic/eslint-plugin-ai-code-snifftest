# Learn workflow

Adds a reconciliation step that:
- Extracts current patterns (naming, constants, generics)
- Compares to sane defaults
- Reconciles to aligned settings and domain-aware constants
- Supports interactive, strict, and permissive modes

Usage:

```
eslint-plugin-ai-code-snifftest learn [--strict|--permissive|--interactive] [--sample=N] [--no-cache] [--apply] [--fingerprint]
```

Modes:
- strict: enforce sane defaults; do not adopt weak local patterns
- adaptive (default): adopt clear majorities; fall back to sane defaults
- permissive: report current state without changing config; writes .ai-learn-report.json when --apply

Interactive per-item review:
- Naming style and boolean prefixes (inline edit)
- Constants: [add] to fingerprint, [rename], [map] value→domain (updates constantResolution), [skip]
- Writes .ai-constants/project-fingerprint.js when selected

Fingerprint consumption:
- `init` will auto-merge `.ai-constants/project-fingerprint.js` into `.ai-coding-guide.json`:
  - Adds mapped domains to domains.additional
  - Seeds constantResolution { "<value>": "<domain>" }

Flags:
- --sample: limit files scanned (sampling)
- --no-cache: skip .ai-learn-cache.json (default uses cache)
- --apply: write config (strict/adaptive) or report (permissive)
- --fingerprint: write fingerprint from top suggestions (non-interactive)

Key features:
- Sampling and caching for fast scans (.ai-learn-cache.json)
- Domain-aware constant name suggestions via builtin constants library
- Per-item interactive review to apply config changes and optionally generate .ai-constants/project-fingerprint.js
- Quality score with breakdown and warnings
