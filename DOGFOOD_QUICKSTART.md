# Dogfood Testing Quick Start

**TL;DR:** Run our plugin on itself to find issues.

## Start Testing (5 commands)

```bash
# 1. Create test branch
git checkout -b dogfood/test-$(date +%Y%m%d-%H%M)

# 2. Run learn
node bin/cli.js learn --interactive --sample=300

# 3. Run init  
node bin/cli.js init --primary=dev-tools --additional=cli,linting

# 4. Run ESLint on ourselves
npx eslint . > dogfood-results.txt 2>&1

# 5. Review results
cat dogfood-results.txt
```

## What to Look For

### ✅ Good Signs
- Learn discovers constants in `lib/constants/`
- Init generates all 4 config files
- ESLint detects `bin/cli.js` as too long (548 lines)
- Rules work without false positives
- AGENTS.md has correct domain (dev-tools, not "general")

### ❌ Red Flags
- **Crashes** during any phase
- **Generated configs are invalid** (syntax errors)
- **Rules don't fire** when they should
- **False positives** on valid code
- **Auto-fix breaks code**

## Known Issues (Expected)
- ⚠️ `bin/cli.js` is 548 lines (violates 100-line limit) - This is GOOD! Shows our rules work!
- ⚠️ Some functions may be complex - Will be refactored

## Create Issues

For each problem found:

```bash
# Use GitHub issue template
gh issue create --template dogfood-test.md --title "[Dogfood] Brief description"
```

Or use web UI: Issues → New Issue → "Dogfood Test Issue"

## Detailed Instructions

See [DOGFOOD_TEST_PLAN.md](./DOGFOOD_TEST_PLAN.md) for comprehensive testing protocol.

## After Testing

```bash
# Save results
git add dogfood-results.txt learn-report.json
git commit -m 'chore: dogfood test results'

# Return to main
git checkout main

# Keep branch for reference (don't delete yet)
```

---

**Goal:** If our tool can improve its own codebase, it'll work for everyone! 🎯
