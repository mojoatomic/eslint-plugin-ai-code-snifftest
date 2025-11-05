# GitHub Issue: Comprehensive Dogfood Testing

**Copy this content into a new GitHub issue**

---

## Title
`[Meta] Comprehensive Dogfood Testing: Run Plugin on Itself`

## Labels
- `testing`
- `dogfood`
- `meta`
- `enhancement`

## Issue Body

---

## Overview

**Objective:** Test `eslint-plugin-ai-code-snifftest` by running it on its own codebase to validate functionality and discover issues.

**The Ultimate Test:** If our plugin can improve its own codebase, it'll work for others! 🎯

## Why This Matters

1. **Self-validation**: Our plugin should detect issues in its own code
2. **Discover edge cases**: Real-world usage on complex codebase
3. **Documentation accuracy**: Verify README matches actual behavior
4. **Rule effectiveness**: Test all 8 rules on production code
5. **Config generation**: Validate `learn` and `init` workflows

## Known Issues Going In

- ✅ `bin/cli.js` is **548 lines** (violates our 100-line CLI limit)
- ❓ Possible naming inconsistencies
- ❓ Unknown constants that should be extracted
- ❓ Potential generic names in utility functions

**Finding these = SUCCESS!** 🎉

## Test Scope

### Phase 1: Learn Command
- Run `learn` on project root
- Verify constant discovery in `lib/constants/`
- Check naming pattern detection
- Validate reconciliation logic

### Phase 2: Init Command
- Test fingerprint consumption
- Verify all configs generated correctly
- Validate domain assignment (dev-tools, not "general")
- Check architecture guardrails

### Phase 3: ESLint Rules (8 rules)
Test each rule individually:
1. `no-redundant-calculations` - Magic numbers
2. `no-generic-names` - Generic variable names
3. `enforce-naming-conventions` - camelCase, prefixes
4. `enforce-domain-terms` - Domain-specific terminology
5. `no-equivalent-branches` - Identical if/else
6. `no-redundant-conditionals` - Unnecessary logic
7. `prefer-simpler-logic` - Overly complex expressions
8. `no-unnecessary-abstraction` - Trivial wrappers

### Phase 4: Architecture Violations
- File length limits (cli.js should violate!)
- Function complexity
- Test file exemptions

### Phase 5: Documentation
- AGENTS.md accuracy
- README correctness
- Self-consistency

### Phase 6: Edge Cases
- Empty files
- Very large files
- Missing config fallbacks

## Quick Start

```bash
# 1. Create test branch
git checkout -b dogfood/test-$(date +%Y%m%d-%H%M)

# 2. Run learn
node bin/cli.js learn --interactive --sample=300

# 3. Run init
node bin/cli.js init --primary=dev-tools --additional=cli,linting

# 4. Run ESLint
npx eslint . > dogfood-results.txt 2>&1

# 5. Review
cat dogfood-results.txt
```

## Success Criteria

**Pass when:**
- ✅ Learn scans without crashes
- ✅ Init generates valid configs
- ✅ ESLint detects `cli.js` violation (548 > 100 lines)
- ✅ All 8 rules work correctly
- ✅ No false positives
- ✅ Auto-fix doesn't break code
- ✅ AGENTS.md matches project domain
- ✅ README is accurate

**Acceptable "failures":**
- ⚠️ `bin/cli.js` exceeds limits - **This proves our rules work!**
- ⚠️ Some complexity violations - Refactor planned

**Unacceptable issues:**
- ❌ Crashes during execution
- ❌ Invalid generated configs
- ❌ Rules don't fire when they should
- ❌ False positives on valid code
- ❌ Inaccurate documentation

## Deliverables

After testing, produce:

1. **Test results summary** (`dogfood-results.md`)
2. **Learn report** (`learn-report.json`)
3. **Generated configs** (`.ai-coding-guide.json`, `AGENTS.md`, `eslint.config.js`)
4. **Issue list** - GitHub issues for each problem found
5. **Test branch** - Archived for reference

## Documentation

Three documents created for this initiative:

1. **[DOGFOOD_QUICKSTART.md](./DOGFOOD_QUICKSTART.md)** - 5-command quick start
2. **[DOGFOOD_TEST_PLAN.md](./DOGFOOD_TEST_PLAN.md)** - Comprehensive testing protocol (all 7 phases)
3. **[.github/ISSUE_TEMPLATE/dogfood-test.md](./.github/ISSUE_TEMPLATE/dogfood-test.md)** - Issue template for tracking test execution

## Issue Tracking

For each issue discovered, create a new issue using format:

```
**Title:** [Dogfood] Brief description

**Severity:**
🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low

**Found During:** Phase X.Y - [test name]

**Description:** What we found when testing on our own codebase

**Expected vs Actual:** Clear comparison

**Files Affected:**
- bin/cli.js
- lib/rules/[rule].js

**Test Branch:** dogfood/test-YYYYMMDD-HHMM

**Reproducible:** Steps to reproduce

**Proposed Fix:** [if known]
```

## Timeline

**Phase 1 (Initial Test):** 2-4 hours
- Run all tests
- Document findings
- Create issues

**Phase 2 (Fix & Iterate):** Ongoing
- Address critical/high issues
- Re-run dogfood tests
- Track improvement over time

**Goal:** Fewer violations each iteration!

## Related

- #89 (if exists) - CLI file length violation
- Future: Regular dogfood testing in CI/CD

## Call to Action

**Ready to start?** See [DOGFOOD_QUICKSTART.md](./DOGFOOD_QUICKSTART.md)

**Need details?** See [DOGFOOD_TEST_PLAN.md](./DOGFOOD_TEST_PLAN.md)

**Questions?** Comment below!

---

## Checklist

- [ ] Create test branch
- [ ] Execute Phase 1-7 tests
- [ ] Document all findings
- [ ] Create issues for problems found
- [ ] Update README if inaccurate
- [ ] Archive test branch
- [ ] Plan iteration schedule

---

**This is how we validate our own work.** If we can lint ourselves successfully, we can lint anything! 💪

## Additional Context

**Why "dogfood"?** "Eating your own dog food" means using your own product. The best way to test a linter is to lint itself!

**Expected violations:** Yes, we expect to find issues - that's the point! Finding issues proves our rules work. The worst outcome would be finding NOTHING (false negatives).

**Test branch philosophy:** We create a test branch, run experiments, document findings, then return to main. The branch serves as a historical record.

---

/cc @[team-members] - Ready to dogfood! 🐕
