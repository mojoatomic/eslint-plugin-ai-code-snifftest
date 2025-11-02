# Multi-Domain Wizard Flow (v2)

This document outlines the planned steps for `npx eslint-plugin-ai-code-snifftest init` to collect domain context.

- Select primary domain
- Suggest additional domains commonly paired
- Allow custom additions
- Generate `.ai-coding-guide.json` (domains, domainPriority, constantResolution)
- Scaffold `.ai-coding-guide.md` (human version)
- Update ESLint config with presets

Non-goals in this PR: code generation; tracked separately.

CLI usage examples:

```bash
# Interactive
eslint-plugin-ai-code-snifftest init

# Non-interactive
eslint-plugin-ai-code-snifftest init --primary=astronomy --additional=geometry,math,units
```
