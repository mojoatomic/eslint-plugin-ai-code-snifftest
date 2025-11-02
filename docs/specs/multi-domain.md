# Multi-Domain, Config-First Linting

- Domains are declared up-front via `.ai-coding-guide.json`
- Rules consult config (no guessing) for constants, terms, and naming
- Annotations: `@domain` (file/section/inline) and `@domains` (priority list)

## Precedence
1. Inline annotations (highest)
2. Name cues (terms)
3. constantResolution map
4. Project domainPriority
5. Built-in heuristics (last resort)

## Disambiguation
- Prefer annotations when numbers are overloaded (e.g., 360, 440)
- Use descriptive names (`circleAngleDegrees` vs `frequencyHz`)
- Project-wide mapping in `constantResolution` for recurring cases

## Wizard
`eslint-plugin-ai-code-snifftest init` generates `.ai-coding-guide.json/.md`, `AGENTS.md`, `.cursorrules`, and `eslint.config.js`.

## Link
See RFC #64 for external constants packages and discovery.