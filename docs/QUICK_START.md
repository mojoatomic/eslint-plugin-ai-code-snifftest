# eslint-plugin-ai-code-snifftest - Quick Start Guide

## 🎯 The Pitch
**Does your AI-generated code pass the sniff test?**

AI writes code that works but often stinks. This ESLint plugin detects and fixes AI-specific code smell automatically.

## 🚀 Quick Start (Day 1)

```bash
# 1. Generate plugin structure
npm install -g yo generator-eslint
mkdir eslint-plugin-ai-code-snifftest
cd eslint-plugin-ai-code-snifftest
yo eslint:plugin

# 2. Install dependencies
npm install --save-dev c8 eslint @types/node

# 3. Create first rule
yo eslint:rule
# Rule ID: no-redundant-calculations
# Type: suggestion
# Category: Best Practices

# 4. Run tests
npm test

# 5. Set up CI
mkdir -p .github/workflows
# Copy test.yml from full issue

# 6. Build first POC
# Implement 30+ tests for no-redundant-calculations
# Verify auto-fix works
# Ship v0.1.0
```

## 📋 The 5 Core Rules (v1.0)

| Rule | Type | Priority | Tests | Description |
|------|------|----------|-------|-------------|
| `no-redundant-calculations` | 🔧 Auto-fix | HIGH | 30+ | `1+2+3` → `6` |
| `no-equivalent-branches` | 🔧 Auto-fix | HIGH | 40+ | Remove identical if/else |
| `prefer-simpler-logic` | 🔧 Auto-fix | HIGH | 50+ | `x === true && y \|\| y` → `x \|\| y` |
| `no-unnecessary-abstraction` | 💡 Suggest | MED | 35+ | Flag one-time wrappers |
| `no-defensive-overkill` | 💡 Suggest | MED | 45+ | Reduce excessive checks |

**Total: 220+ test cases**

## 📅 5-Week Plan

### Week 1: Foundation
- Plugin scaffolding via generator
- Testing infrastructure (RuleTester, c8, CI)
- Development tooling (ESLint, Prettier)
- **Ship:** Scaffolding complete, tests run

### Week 2-3: Core Rules
- Implement all 5 rules
- Write 220+ comprehensive tests
- Add auto-fix for rules 1-3
- **Ship:** All rules working, tests passing

### Week 4: Polish
- Documentation site
- Examples repository
- README with badges
- Contributor docs
- **Ship:** Docs complete

### Week 5: Release
- Pre-release checklist
- npm publish
- GitHub release v1.0.0
- Announcements (HN, Reddit, Twitter)
- **Ship:** Public release

## ✅ Definition of Done (v1.0.0)

1. ✅ All 5 rules implemented with 220+ tests
2. ✅ Documentation complete (README, site, examples)
3. ✅ Published to npm and installable
4. ✅ CI/CD passing, coverage ≥ 95%
5. ✅ Zero known critical bugs
6. ✅ Announced publicly
7. ✅ Tested on 3+ real projects
8. ✅ Contributor guidelines in place

## 🎯 Success Metrics (30 Days)

- 100+ npm downloads
- 10+ GitHub stars
- 5+ GitHub issues/discussions
- 1+ external contributor
- Zero critical bugs

## 🔧 Usage Examples

```javascript
// eslint.config.mjs
import aiSnifftest from 'eslint-plugin-ai-code-snifftest';

export default [
  aiSnifftest.configs.recommended,
  {
    rules: {
      'ai-snifftest/no-redundant-calculations': 'error'
    }
  }
];
```

### CLI: Initialize AI Coding Guide

Interactive (accept defaults):
```bash
node bin/cli.js init
# Prompts will appear; press Enter to accept defaults
```

Non-interactive:
```bash
node bin/cli.js init --primary=astronomy --additional=geometry,math --yes --cursor --agents --eslint
```

Scaffold an external constants package:
```bash
node bin/cli.js scaffold medical --dir=./examples/external/medical
```

## 📝 Package Details

- **Name:** `eslint-plugin-ai-code-snifftest`
- **Short name:** `ai-snifftest` (for configs)
- **License:** MIT
- **Node:** >=18.0.0
- **ESLint:** >=8.0.0

## 🔗 Key Resources

- Full GitHub Issue: 1,257 lines, comprehensive
- ESLint Plugin Docs: https://eslint.org/docs/latest/extend/plugins
- AST Explorer: https://astexplorer.net/
- Generator: `npm install -g yo generator-eslint`

## 💡 Why "snifftest"?

1. **Professional idiom:** "Does this pass the sniff test?"
2. **Technical term:** "Sniff" = detecting code smell
3. **Clear scope:** AI code quality control
4. **Enterprise-friendly:** Can say in meetings
5. **Memorable:** Will trend on HN/Twitter

## 🎬 Next Action

```bash
yo eslint:plugin
```

**Build the first rule. Ship v0.1.0. Iterate to v1.0.0.**

---

**Full details in:** `eslint-plugin-ai-code-snifftest-github-issue.md` (1,257 lines)
