# Dogfood Testing Plan: Run eslint-plugin-ai-code-snifftest on Itself

**Status:** 🚧 Ready to Execute  
**Purpose:** Test the plugin by running it on its own codebase  
**Branch Pattern:** `dogfood/test-YYYYMMDD-HHMM`  

---

## Overview

This is the ultimate validation: if our plugin can improve its own codebase, it'll work for others. We'll run every command (`learn`, `init`, ESLint rules) on this project and document all findings.

**Known Issues Going In:**
- ✅ `bin/cli.js` is 548 lines (violates 100-line CLI limit)
- ❓ Possible naming inconsistencies
- ❓ Unknown constants that should be extracted

---

## Safety Protocol

```bash
# 1. Create test branch
git checkout -b dogfood/test-$(date +%Y%m%d-%H%M)

# 2. Ensure clean state
git status  # Should be clean

# 3. Backup current configs (if any exist)
mkdir -p .backup
cp .ai-coding-guide.json .backup/ 2>/dev/null || true
cp eslint.config.js .backup/ 2>/dev/null || true
cp AGENTS.md .backup/ 2>/dev/null || true
```

---

## Phase 1: Learn from Our Own Code

### Test 1.1: Scan the codebase

```bash
# Run learn on THIS project
node bin/cli.js learn --interactive --sample=300

# Watch for:
# - Constants detected in lib/constants/*.js
# - Naming patterns in lib/rules/*.js
# - Generic names in bin/cli.js (likely!)
```

**Review findings:**
```bash
cat learn-report.json | jq '.findings'
```

**Expected discoveries:**
- ✅ Should find constants in `lib/constants/` files
- ✅ Should detect naming patterns (camelCase/UPPER_SNAKE_CASE)
- ✅ Should flag generic names if any exist
- ⚠️ May detect `cli.js` as oversized

**Document:**
- What constants were found?
- What naming patterns detected?
- Any surprises?

**If issues:**
- ❌ Crashes during scan → Issue: "Learn crashes on own codebase"
- ❌ No constants found → Issue: "Learn doesn't detect constants in lib/constants/"
- ❌ Wrong naming pattern → Issue: "Learn misidentifies naming conventions"

---

### Test 1.2: Review reconciliation

**Check the reconciled rules:**
```bash
cat learn-report.json | jq '.result'
```

**Expected:**
- `naming.style: "camelCase"` (we use camelCase)
- `booleanPrefix: ["is", "has", "should", "can"]` (standard)
- `antiPatterns.forbiddenNames` may include generic names found

**If issues:**
- Recommends wrong naming style → Issue: "Reconciliation incorrect for project"

---

### Test 1.3: Accept or adjust findings

**Interactive mode should prompt:**
- Enforce naming.style='camelCase'? **[Y]**
- Enforce booleanPrefix? **[Y]**
- Add forbiddenNames? **[Review each]**

**After completion:**
```bash
# Verify generated files
ls -la .ai-constants/project-fingerprint.js
cat .ai-coding-guide.json
```

**Expected:**
- `.ai-coding-guide.json` created/updated
- `project-fingerprint.js` exists with discovered constants

---

## Phase 2: Initialize with Our Domain

### Test 2.1: Run init (consumes fingerprint)

```bash
# Our domain should be: dev-tools, cli, linting
node bin/cli.js init --primary=dev-tools --additional=cli,linting
```

**Watch for:**
- Should consume fingerprint automatically
- Should generate all config files
- Should ask about architecture guardrails

**Answer prompts:**
- Generate AGENTS.md, .cursorrules? **[Y]**
- Enable architecture guardrails? **[Y]**
- Customize thresholds? **[N]** (use defaults first)

**Verify generated files:**
```bash
ls -la .ai-coding-guide.json AGENTS.md .cursorrules eslint.config.js

# Check content
cat AGENTS.md  # Should show dev-tools domain
cat eslint.config.js  # Should have all rules
```

**Expected:**
- ✅ All 4 files generated
- ✅ `AGENTS.md` has correct domain (dev-tools, not "general")
- ✅ `eslint.config.js` includes architecture rules
- ✅ `.ai-coding-guide.json` has merged fingerprint data

**If issues:**
- Missing files → Issue: "Init doesn't generate [file]"
- Wrong domain in AGENTS.md → Issue: "AGENTS.md shows wrong domain"
- eslint.config.js syntax errors → Issue: "Generated ESLint config invalid"

---

## Phase 3: Test ESLint Plugin Rules

### Test 3.1: no-redundant-calculations

**Create test file:**
```bash
cat > test-redundant-calc.js << 'EOF'
// Should trigger: magic number calculations
function calculateAge(birthYear) {
  return 2024 - birthYear;  // ❌ Should use const CURRENT_YEAR
}

function daysInYear() {
  return 365.25;  // ❌ Should use TROPICAL_YEAR_DAYS
}

function circumference(radius) {
  return 2 * 3.14159 * radius;  // ❌ Should use RADIANS_IN_CIRCLE or Math.PI
}

// Should NOT trigger: using constants
const CURRENT_YEAR = 2024;
function calculateAgeCorrect(birthYear) {
  return CURRENT_YEAR - birthYear;  // ✅ Good
}
EOF
```

**Run rule:**
```bash
npx eslint test-redundant-calc.js --rule 'ai-code-snifftest/no-redundant-calculations: error'
```

**Expected:** 3 violations detected

**Verify auto-fix:**
```bash
npx eslint test-redundant-calc.js --rule 'ai-code-snifftest/no-redundant-calculations: error' --fix
cat test-redundant-calc.js
```

**If fails:**
- Doesn't detect magic numbers → Issue: "no-redundant-calculations: false negatives"
- Flags valid constants → Issue: "no-redundant-calculations: false positives"

---

### Test 3.2: no-generic-names

**Create test file:**
```bash
cat > test-generic-names.js << 'EOF'
// Should trigger: generic names
const data = fetchSomething();        // ❌
const result = processData();         // ❌
const temp = calculate();             // ❌
const value = getValue();             // ❌
const item = getItem();               // ❌

function process(input) {             // ❌ Generic function name
  return input;
}

// Should NOT trigger: specific names
const userData = fetchUser();         // ✅
const calculationResult = process();  // ✅
const celestialBody = getBody();      // ✅
EOF
```

**Run rule:**
```bash
npx eslint test-generic-names.js --rule 'ai-code-snifftest/no-generic-names: error'
```

**Expected:** 6 violations detected

**If fails:**
- Doesn't flag generic names → Issue: "no-generic-names: not detecting violations"
- Flags specific names → Issue: "no-generic-names: false positives on domain terms"

---

### Test 3.3: enforce-naming-conventions

**Create test file:**
```bash
cat > test-naming.js << 'EOF'
// Should trigger: wrong style
const user_name = "John";              // ❌ Should be camelCase
const UserAge = 30;                    // ❌ Should be camelCase

// Should trigger: missing boolean prefix
const active = true;                   // ❌ Should be isActive
const completed = checkStatus();       // ❌ Should be isCompleted

// Should trigger: wrong async prefix
async function getData() {}            // ❌ Should be fetchData or loadData

// Should NOT trigger: correct naming
const userName = "John";               // ✅
const isActive = true;                 // ✅
async function fetchData() {}          // ✅
EOF
```

**Run rule:**
```bash
npx eslint test-naming.js --rule 'ai-code-snifftest/enforce-naming-conventions: error'
```

**Expected:** 5 violations detected with suggestions

---

### Test 3.4: enforce-domain-terms

**Create test file:**
```bash
cat > test-domain-terms.js << 'EOF'
// Assuming dev-tools domain is active

// Should trigger: generic names when domain term exists
function calculateAngle() {}           // ⚠️ Should use more specific term
const distance = 1000;                 // ⚠️ Could be more specific

// Should NOT trigger: domain-specific terms
function parseSyntaxTree() {}          // ✅ Uses domain term
const eslintConfig = {};               // ✅ Domain constant
EOF
```

**Run rule:**
```bash
npx eslint test-domain-terms.js --rule 'ai-code-snifftest/enforce-domain-terms: warn'
```

**Expected:** Suggestions to use domain-specific terms

---

### Test 3.5: no-equivalent-branches

**Create test file:**
```bash
cat > test-equivalent-branches.js << 'EOF'
// Should trigger: identical branches
if (x > 5) {
  console.log("Done");
} else {
  console.log("Done");  // ❌ Same as if-branch
}

// Should trigger: equivalent logic
if (isValid) {
  return true;
} else {
  return true;  // ❌ Same result
}

// Should NOT trigger: different branches
if (x > 5) {
  console.log("High");
} else {
  console.log("Low");  // ✅ Different
}
EOF
```

**Run rule:**
```bash
npx eslint test-equivalent-branches.js --rule 'ai-code-snifftest/no-equivalent-branches: error' --fix
cat test-equivalent-branches.js
```

**Expected:** 2 violations detected, auto-fix removes else branches

---

### Test 3.6: no-redundant-conditionals

**Create test file:**
```bash
cat > test-redundant-conditionals.js << 'EOF'
// Should trigger: redundant conditionals
if (true) {                    // ❌ Always true
  doSomething();
}

const result = x ? true : false;  // ❌ Just return x
const value = isValid ? false : true;  // ❌ Just return !isValid

// Should NOT trigger: necessary conditionals
if (x > 5) {
  doSomething();
}
EOF
```

**Run rule:**
```bash
npx eslint test-redundant-conditionals.js --rule 'ai-code-snifftest/no-redundant-conditionals: error' --fix
cat test-redundant-conditionals.js
```

**Expected:** 3 violations detected, auto-fix simplifies

---

### Test 3.7: prefer-simpler-logic

**Create test file:**
```bash
cat > test-simpler-logic.js << 'EOF'
// Should trigger: overly complex boolean logic
if (!(x > 5)) {                    // ❌ Should be: x <= 5
  doSomething();
}

const result = !(!isValid);        // ❌ Should be: isValid

if (x === true) {                  // ❌ Should be: if (x)
  doSomething();
}

// Should NOT trigger: necessary logic
if (x > 5 && y < 10) {
  doSomething();
}
EOF
```

**Run rule:**
```bash
npx eslint test-simpler-logic.js --rule 'ai-code-snifftest/prefer-simpler-logic: error' --fix
cat test-simpler-logic.js
```

**Expected:** 3 violations detected, auto-fix simplifies logic

---

### Test 3.8: no-unnecessary-abstraction

**Create test file:**
```bash
cat > test-unnecessary-abstraction.js << 'EOF'
// Should trigger: trivial wrappers
function add(a, b) {
  return a + b;
}

function getUser() {
  return user;  // Just returns variable
}

// Used only once
const result = add(1, 2);  // ❌ Inline it

// Should NOT trigger: used multiple times
function calculate(x, y) {
  return x * y + 10;  // Non-trivial
}

const a = calculate(1, 2);
const b = calculate(3, 4);
EOF
```

**Run rule:**
```bash
npx eslint test-unnecessary-abstraction.js --rule 'ai-code-snifftest/no-unnecessary-abstraction: warn'
```

**Expected:** Suggestions to inline trivial wrappers

---

### Test 3.9: Run ESLint on Entire Codebase

```bash
# Use the generated config
npx eslint .

# Save output
npx eslint . > lint-results.txt 2>&1
```

**Expected violations (we know about these):**

1. **bin/cli.js** - File length violation (548 lines)
2. Possible function length violations in cli.js
3. Possible complexity warnings
4. Magic numbers (if any exist)
5. Generic names (if any)

**Analyze results:**
```bash
# Count violations by rule
cat lint-results.txt | grep -E "(error|warning)" | awk '{print $NF}' | sort | uniq -c | sort -rn

# Show cli.js specific issues
cat lint-results.txt | grep "bin/cli.js"
```

---

## Phase 4: Architecture Violations

### Test 4.1: Known violation - cli.js too long

```bash
# This SHOULD error
npx eslint bin/cli.js

# Check specific error
npx eslint bin/cli.js | grep "max-lines"
```

**Expected:**
```
bin/cli.js
  1:1  error  File has too many lines (548). Maximum allowed is 100  max-lines
```

**If doesn't error:**
- Issue: "File length limit not enforced on CLI files"

---

### Test 4.2: Function complexity

```bash
# Find complex functions
npx eslint . --rule 'complexity: [error, 10]'

# Check cli.js specifically (likely has complex functions)
npx eslint bin/cli.js --rule 'complexity: [error, 10]'
```

**Expected:** Violations in cli.js (initInteractive, etc.)

---

### Test 4.3: Test file exemptions

```bash
# Tests should be exempt from complexity
npx eslint test/ --rule 'complexity: [error, 10]'
npx eslint test/ --rule 'max-statements: [error, 30]'
```

**Expected:** No violations (tests are exempt)

---

## Phase 5: AGENTS.md Accuracy

### Test 5.1: Verify AGENTS.md content

```bash
cat AGENTS.md
```

**Check for:**
- ✅ Project type mentioned (dev-tools/CLI)
- ✅ Domains: dev-tools, cli, linting (NOT "general")
- ✅ File structure example shown
- ✅ File length limits table
- ✅ Function limits listed
- ✅ Code examples (good/bad)
- ✅ Import/export conventions
- ✅ Test conventions

**If missing/wrong:**
- Generic domain → Issue: "AGENTS.md uses generic domain instead of project-specific"
- No file structure → Issue: "AGENTS.md missing file organization examples"

---

### Test 5.2: Compare with actual codebase

```bash
# Check if our actual code follows AGENTS.md rules
find lib -name "*.js" -exec head -20 {} \; | grep -E "^(const|let|var|function)" | head -20
```

**Verify:**
- Do we use camelCase? (should be yes)
- Do we have boolean prefixes? (check lib/rules/)
- Do we follow our own file limits? (spoiler: bin/cli.js doesn't!)

---

## Phase 6: Self-Consistency Check

### Test 6.1: Plugin dogfoods itself

```bash
# Count violations by severity
echo "Errors:" && npx eslint . --quiet | wc -l
echo "Warnings:" && npx eslint . | grep warning | wc -l

# Biggest offenders
npx eslint . --format json | jq -r '.[] | select(.errorCount > 0 or .warningCount > 0) | "\(.filePath): \(.errorCount) errors, \(.warningCount) warnings"' | sort -t: -k2 -rn | head -10
```

**Expected:**
- ⚠️ Some violations (we know cli.js is problematic)
- ✅ Most code should pass
- ✅ Test files should be clean

---

### Test 6.2: README accuracy

**Cross-reference README with actual behavior:**
```bash
# README claims these rules exist - verify
npx eslint --print-config . | jq '.rules' | grep ai-code-snifftest

# README claims auto-fix works - verify
npx eslint --help | grep -A5 "fix"
```

**Check README sections:**
- Installation steps work? ✅
- Usage examples accurate? ✅
- Rule list matches `lib/rules/`? ✅
- Architecture section matches implementation? ✅

---

## Phase 7: Edge Cases

### Test 7.1: Empty files

```bash
touch empty.js
npx eslint empty.js
rm empty.js
```

**Expected:** No crash, no violations

---

### Test 7.2: Very large file

```bash
# Create 1000-line file (way over limit)
for i in {1..1000}; do echo "console.log($i);"; done > large-test.js

npx eslint large-test.js
rm large-test.js
```

**Expected:** Clear error about file length

---

### Test 7.3: No config file

```bash
# Temporarily hide config
mv .ai-coding-guide.json .ai-coding-guide.json.bak

npx eslint lib/rules/no-generic-names.js

# Restore
mv .ai-coding-guide.json.bak .ai-coding-guide.json
```

**Expected:** Rules still work with defaults (or clear error)

---

## Cleanup

```bash
# Save results
echo "# Dogfood Test Results" > dogfood-results.md
echo "" >> dogfood-results.md
echo "## Violations Found" >> dogfood-results.md
npx eslint . >> dogfood-results.md

# Commit test results (optional)
git add dogfood-results.md learn-report.json
git commit -m 'chore: dogfood test results'

# Return to main
git checkout main

# Archive test branch (don't delete yet - may need for reference)
git branch --move dogfood/test-$(date +%Y%m%d-%H%M) dogfood/archive-$(date +%Y%m%d-%H%M)
```

---

## Success Criteria

**Pass when:**
- ✅ Learn command scans our code without crashes
- ✅ Init generates valid configs
- ✅ ESLint runs on our codebase
- ✅ Architecture rules detect our violations (cli.js)
- ✅ AGENTS.md accurately reflects project
- ✅ No false positives in rules
- ✅ Auto-fix doesn't break code
- ✅ README matches actual behavior

**Known acceptable violations:**
- ⚠️ bin/cli.js exceeds 100 lines (known, will be fixed)
- ⚠️ Some functions may be complex (refactor coming)

**Unacceptable issues:**
- ❌ Crashes during any phase
- ❌ Generated config is invalid
- ❌ Rules don't fire when they should
- ❌ False positives
- ❌ README is inaccurate

---

## Issue Tracking Template

**For each issue found, create GitHub issue:**

```markdown
**Title:** [Dogfood] Brief description

**Found During:** Dogfooding test phase [X]

**Severity:** 
- 🔴 Critical: Crashes, data loss, unusable
- 🟡 High: Major feature broken
- 🟢 Medium: Minor issue, workaround exists
- ⚪ Low: Polish, enhancement

**Description:**
What we found when testing on our own codebase

**Steps to Reproduce:**
1. Run on project root: `node bin/cli.js [command]`
2. Observe: [behavior]

**Expected:**
What should happen

**Actual:**
What actually happened

**Files Affected:**
- bin/cli.js
- lib/rules/[rule].js

**Test Branch:** dogfood/test-[timestamp]

**Proposed Fix:**
[if known]
```

---

## Next Iteration

**After fixing issues on main:**
```bash
# Start fresh dogfood test
git checkout -b dogfood/test-$(date +%Y%m%d-%H%M)
node bin/cli.js learn --interactive
node bin/cli.js init
npx eslint .

# Compare with previous results
diff dogfood-results.md previous-dogfood-results.md

# Goal: Fewer violations each iteration
```

---

## Summary

**This workflow tests:**
1. ✅ Tool works on its own codebase
2. ✅ Discovers our own constants/patterns
3. ✅ Detects our own violations (cli.js)
4. ✅ Generated configs are valid
5. ✅ Rules work as documented
6. ✅ AGENTS.md is accurate
7. ✅ We follow our own recommendations

**The ultimate test:** If our tool can improve our own codebase, it'll work for others! 🎯
