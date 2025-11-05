# Dogfood Testing Documentation

This directory contains comprehensive documentation for dogfood testing (testing the plugin on itself).

## Quick Links

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[DOGFOOD_QUICKSTART.md](./DOGFOOD_QUICKSTART.md)** | 5-minute start guide | Starting a test run |
| **[DOGFOOD_TEST_PLAN.md](./DOGFOOD_TEST_PLAN.md)** | Complete test protocol | Detailed testing |
| **[GITHUB_ISSUE_DOGFOOD.md](./GITHUB_ISSUE_DOGFOOD.md)** | GitHub issue template | Creating the tracking issue |
| **[.github/ISSUE_TEMPLATE/dogfood-test.md](./.github/ISSUE_TEMPLATE/dogfood-test.md)** | Test execution tracker | Recording test results |

## What is Dogfood Testing?

"Eating your own dog food" means using your own product. For our ESLint plugin, this means:

1. Running `learn` on our own codebase
2. Running `init` to generate our own configs
3. Running `npx eslint` on our own code
4. Finding issues in our own implementation

**The Ultimate Validation:** If our plugin can improve its own codebase, it'll work for everyone!

## Quick Start (30 seconds)

```bash
# Create test branch
git checkout -b dogfood/test-$(date +%Y%m%d-%H%M)

# Run learn
node bin/cli.js learn --interactive --sample=300

# Run init
node bin/cli.js init --primary=dev-tools --additional=cli,linting

# Run ESLint
npx eslint . > dogfood-results.txt 2>&1

# Review
cat dogfood-results.txt
```

## What We're Testing

### CLI Commands (2)
- ✅ `learn` - Analyzes our own code patterns
- ✅ `init` - Generates configs for ourselves

### ESLint Rules (8)
1. `no-redundant-calculations`
2. `no-generic-names`
3. `enforce-naming-conventions`
4. `enforce-domain-terms`
5. `no-equivalent-branches`
6. `no-redundant-conditionals`
7. `prefer-simpler-logic`
8. `no-unnecessary-abstraction`

### Architecture Guardrails
- File length limits
- Function complexity
- Test exemptions

### Documentation
- README accuracy
- AGENTS.md correctness
- Self-consistency

## Known Issues (Good News!)

We **expect** to find these issues:

- ⚠️ `bin/cli.js` is 548 lines (violates 100-line limit)
- ⚠️ Some functions may be complex

**Finding these = SUCCESS!** It proves our rules work!

## Success Criteria

**Pass when:**
- ✅ No crashes
- ✅ Valid configs generated
- ✅ Rules detect violations (especially cli.js!)
- ✅ No false positives
- ✅ Auto-fix works correctly

**Unacceptable:**
- ❌ Crashes
- ❌ Invalid configs
- ❌ False positives
- ❌ Rules don't fire

## How to Use This Documentation

### If you have 5 minutes:
→ Read [DOGFOOD_QUICKSTART.md](./DOGFOOD_QUICKSTART.md)

### If you have 1 hour:
→ Read [DOGFOOD_TEST_PLAN.md](./DOGFOOD_TEST_PLAN.md)  
→ Execute the tests  
→ Document findings

### If you're creating the GitHub issue:
→ Copy content from [GITHUB_ISSUE_DOGFOOD.md](./GITHUB_ISSUE_DOGFOOD.md)

### If you're tracking test execution:
→ Use [.github/ISSUE_TEMPLATE/dogfood-test.md](./.github/ISSUE_TEMPLATE/dogfood-test.md)

## Iteration Schedule

**Initial Test:** First comprehensive run
- Duration: 2-4 hours
- Goal: Discover all issues

**Follow-up Tests:** After fixing issues
- Frequency: After major changes
- Goal: Fewer violations each time

**CI/CD Integration:** Future
- Automated dogfood tests
- Track metrics over time

## Expected Outcomes

### Phase 1: Learn
- Discovers constants in `lib/constants/`
- Detects camelCase naming pattern
- Finds any generic names

### Phase 2: Init
- Generates 4 config files
- Sets domain to "dev-tools" (not "general")
- Enables architecture guardrails

### Phase 3: ESLint
- Detects `bin/cli.js` as too long ✅
- May find complexity violations ✅
- Should have minimal false positives

### Phase 4: Documentation
- AGENTS.md reflects actual project
- README matches behavior
- Code follows stated conventions

## Created Files

After testing, you'll have:

```
dogfood/test-YYYYMMDD-HHMM/
├── learn-report.json          # Learn command output
├── dogfood-results.txt        # ESLint results
├── .ai-coding-guide.json      # Generated config
├── AGENTS.md                  # Generated agent guide
├── eslint.config.js           # Generated ESLint config
├── .cursorrules               # Generated Cursor rules
└── test-*.js                  # Test files for rule validation
```

## Issue Tracking

For each issue found, create a GitHub issue:

**Format:**
```
[Dogfood] Brief description
Severity: 🔴/🟡/🟢/⚪
Phase: X.Y
```

**Template:** Use `.github/ISSUE_TEMPLATE/dogfood-test.md`

## Why This Matters

1. **Self-validation** - We should follow our own rules
2. **Real-world testing** - Complex codebase = good test
3. **Documentation proof** - Verifies README accuracy
4. **Confidence** - If we can lint ourselves, we can lint anything!

## Questions?

- **What if we find NO issues?** - That's bad! False negatives.
- **What if we find LOTS of issues?** - Great! Our rules work!
- **Should we fix everything?** - Critical/High first, then prioritize
- **How often to dogfood?** - After major changes, eventually in CI

---

## Call to Action

**Ready to start?** → [DOGFOOD_QUICKSTART.md](./DOGFOOD_QUICKSTART.md)

**Need full protocol?** → [DOGFOOD_TEST_PLAN.md](./DOGFOOD_TEST_PLAN.md)

**Creating GitHub issue?** → [GITHUB_ISSUE_DOGFOOD.md](./GITHUB_ISSUE_DOGFOOD.md)

---

**The best linters lint themselves!** 🎯
