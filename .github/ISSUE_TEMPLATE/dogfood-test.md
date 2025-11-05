---
name: Dogfood Test Issue
about: Track dogfood testing execution and findings
title: '[Dogfood] Test Run YYYY-MM-DD'
labels: testing, dogfood, meta
assignees: ''
---

## Dogfood Test Execution

**Test Branch:** `dogfood/test-YYYYMMDD-HHMM`  
**Test Date:** YYYY-MM-DD  
**Tester:** @username  

See [DOGFOOD_TEST_PLAN.md](../../../DOGFOOD_TEST_PLAN.md) for full testing protocol.

---

## Test Progress

### Phase 1: Learn Command
- [ ] Test 1.1: Scan codebase
- [ ] Test 1.2: Review reconciliation
- [ ] Test 1.3: Accept/adjust findings

**Findings:**
- Constants discovered: 
- Naming patterns detected:
- Issues found:

---

### Phase 2: Init Command
- [ ] Test 2.1: Run init with fingerprint consumption

**Results:**
- ✅/❌ `.ai-coding-guide.json` generated
- ✅/❌ `AGENTS.md` generated with correct domain
- ✅/❌ `eslint.config.js` generated and valid
- ✅/❌ `.cursorrules` generated

**Issues found:**

---

### Phase 3: ESLint Plugin Rules
- [ ] Test 3.1: no-redundant-calculations
- [ ] Test 3.2: no-generic-names
- [ ] Test 3.3: enforce-naming-conventions
- [ ] Test 3.4: enforce-domain-terms
- [ ] Test 3.5: no-equivalent-branches
- [ ] Test 3.6: no-redundant-conditionals
- [ ] Test 3.7: prefer-simpler-logic
- [ ] Test 3.8: no-unnecessary-abstraction
- [ ] Test 3.9: Run on entire codebase

**Rule Test Results:**
| Rule | Detection | Auto-fix | False Positives | Status |
|------|-----------|----------|-----------------|--------|
| no-redundant-calculations | ✅/❌ | ✅/❌ | ✅/❌ | Pass/Fail |
| no-generic-names | ✅/❌ | N/A | ✅/❌ | Pass/Fail |
| enforce-naming-conventions | ✅/❌ | ✅/❌ | ✅/❌ | Pass/Fail |
| enforce-domain-terms | ✅/❌ | N/A | ✅/❌ | Pass/Fail |
| no-equivalent-branches | ✅/❌ | ✅/❌ | ✅/❌ | Pass/Fail |
| no-redundant-conditionals | ✅/❌ | ✅/❌ | ✅/❌ | Pass/Fail |
| prefer-simpler-logic | ✅/❌ | ✅/❌ | ✅/❌ | Pass/Fail |
| no-unnecessary-abstraction | ✅/❌ | N/A | ✅/❌ | Pass/Fail |

**Issues found:**

---

### Phase 4: Architecture Violations
- [ ] Test 4.1: Known violation - cli.js length
- [ ] Test 4.2: Function complexity
- [ ] Test 4.3: Test file exemptions

**Results:**
- bin/cli.js violations detected: ✅/❌
- Complexity rules working: ✅/❌
- Test exemptions working: ✅/❌

**Issues found:**

---

### Phase 5: AGENTS.md Accuracy
- [ ] Test 5.1: Verify AGENTS.md content
- [ ] Test 5.2: Compare with actual codebase

**Results:**
- Domain accuracy: ✅/❌
- File structure examples: ✅/❌
- Consistent with codebase: ✅/❌

**Issues found:**

---

### Phase 6: Self-Consistency
- [ ] Test 6.1: Plugin dogfoods itself
- [ ] Test 6.2: README accuracy

**Violations Summary:**
- Total errors: 
- Total warnings:
- Top violators:
  1. 
  2. 
  3. 

**README Accuracy:** ✅/❌

**Issues found:**

---

### Phase 7: Edge Cases
- [ ] Test 7.1: Empty files
- [ ] Test 7.2: Very large file
- [ ] Test 7.3: No config file

**Results:**
- All edge cases handled: ✅/❌

**Issues found:**

---

## Overall Test Summary

### Success Metrics
- [ ] Learn command works without crashes
- [ ] Init generates valid configs
- [ ] ESLint runs successfully
- [ ] Architecture rules detect violations
- [ ] AGENTS.md is accurate
- [ ] No false positives in rules
- [ ] Auto-fix doesn't break code
- [ ] README matches behavior

### Discovered Issues
Total issues found: 

**Critical (🔴):**
- 

**High (🟡):**
- 

**Medium (🟢):**
- 

**Low (⚪):**
- 

---

## Known Acceptable Violations
- ⚠️ bin/cli.js exceeds 100 lines (548 lines) - will be addressed separately
- ⚠️ Some functions in cli.js may be complex - refactor planned

---

## Follow-up Actions
- [ ] Create issues for each discovered problem
- [ ] Update documentation if inaccuracies found
- [ ] Fix critical/high severity issues
- [ ] Plan refactor for bin/cli.js
- [ ] Archive test branch after review

---

## Test Artifacts

**Location:** `dogfood/test-YYYYMMDD-HHMM` branch

**Files generated:**
- [ ] `learn-report.json`
- [ ] `dogfood-results.md`
- [ ] `.ai-coding-guide.json`
- [ ] `AGENTS.md`
- [ ] `eslint.config.js`
- [ ] `.cursorrules`
- [ ] Test files (`test-*.js`)

**Command to review:**
```bash
git checkout dogfood/test-YYYYMMDD-HHMM
cat dogfood-results.md
```

---

## Notes

[Add any additional observations, surprises, or insights from the testing process]

---

## Related Issues

- #XX - Issue discovered during this test
- #XX - Another related issue
