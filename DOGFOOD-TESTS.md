# Dogfood Test Suite for eslint-plugin-ai-code-snifftest

Comprehensive tests for validating the analyze/plan/create-issues workflow. This suite is safe for a disposable branch and can be run locally or in CI.

Tip: To run the embedded automated runner without copy/paste, execute:

```bash
bash -c "$(sed -n '/^run_test() {/,/^exit \$TESTS_FAILED/p' DOGFOOD-TESTS.md)"
```

---

## Test Environment Setup

```bash
# Prerequisites
cd /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest
node --version    # Should be ≥18
npm --version     # Should be recent

# Clean slate
rm -f .ai-coding-guide.json AGENTS.md eslint.config.mjs lint-results.json
rm -f analysis-report.md FIXES-ROADMAP.md
rm -rf issues/ issues-*

# Verify plugin is installed
npm list eslint-plugin-ai-code-snifftest || true
```

---

## Test 1: Basic Workflow (Default Options)

Purpose: Verify end-to-end workflow with default settings

```bash
# Setup
npx eslint-plugin-ai-code-snifftest setup --yes --primary=dev-tools --additional=cli,linting

# Lint (note: ESLint exits non-zero on violations; we still want JSON)
npx eslint . --format json > lint-results.json 2>&1 || true

# Analyze (defaults)
npx eslint-plugin-ai-code-snifftest analyze --input=lint-results.json

# Plan (defaults)
npx eslint-plugin-ai-code-snifftest plan --input=lint-results.json

# Create issues (defaults)
npx eslint-plugin-ai-code-snifftest create-issues --input=lint-results.json
```

Expected outputs:
- .ai-coding-guide.json (dev-tools/cli/linting), AGENTS.md, eslint.config.mjs
- lint-results.json, analysis-report.md, FIXES-ROADMAP.md
- issues/ with README and phase files

Quick validations:
```bash
# Files exist
test -f .ai-coding-guide.json && echo "✅ Config exists" || echo "❌ Config missing"
test -f analysis-report.md && echo "✅ Analysis exists" || echo "❌ Analysis missing"
test -f FIXES-ROADMAP.md && echo "✅ Roadmap exists" || echo "❌ Roadmap missing"
test -f issues/00-README.md && echo "✅ Issues exist" || echo "❌ Issues missing"

# Domains in config
grep -q '"primary": "dev-tools"' .ai-coding-guide.json && echo "✅ Primary domain correct"
grep -q '"cli"' .ai-coding-guide.json && echo "✅ Additional domains correct"

# Analysis has content
grep -q "## Categories" analysis-report.md && echo "✅ Analysis has categories"

grep -Eq "dev-tools|cli|linting" analysis-report.md && echo "✅ Analysis references configured domains"

# Roadmap phases
grep -q "^## Phase 1" FIXES-ROADMAP.md && echo "✅ Roadmap has Phase 1"
grep -q "^## Phase 2" FIXES-ROADMAP.md && echo "✅ Roadmap has Phase 2"
grep -q "^## Phase 3" FIXES-ROADMAP.md && echo "✅ Roadmap has Phase 3"
grep -q "^## Phase 4" FIXES-ROADMAP.md && echo "✅ Roadmap has Phase 4"

# GitHub CLI instructions in issues
grep -q "gh issue create" issues/00-README.md && echo "✅ GitHub CLI instructions present"

# Issue count sanity (5-10 incl README)
count=$(ls -1 issues/*.md | wc -l | tr -d ' '); if [ "$count" -ge 5 ] && [ "$count" -le 10 ]; then echo "✅ Issue count reasonable ($count)"; else echo "⚠️  Issue count unexpected ($count)"; fi
```

---

## Test 2: Filtered Analysis (Min Count)

Purpose: Reduce noise with --min-count and smaller --top-files

```bash
# Analyze with filtering
npx eslint-plugin-ai-code-snifftest analyze \
  --input=lint-results.json \
  --output=analysis-filtered.md \
  --min-count=3 \
  --top-files=5

# Plan with filtering
npx eslint-plugin-ai-code-snifftest plan \
  --input=lint-results.json \
  --output=FIXES-ROADMAP-filtered.md \
  --min-count=3 \
  --top-files=5

# Create issues with filtering
npx eslint-plugin-ai-code-snifftest create-issues \
  --input=lint-results.json \
  --output=issues-filtered \
  --min-count=3 \
  --top-files=5

# Validation
test -f analysis-filtered.md && echo "✅ Filtered analysis created"
wc -l analysis-filtered.md analysis-report.md | head -2 || true
```

Expected behavior:
- Fewer one-off violations
- Top 5 files, more focused content

---

## Test 3: Size-Based Effort Estimation

Purpose: Validate --estimate-size scaling

```bash
npx eslint-plugin-ai-code-snifftest analyze \
  --input=lint-results.json \
  --output=analysis-sized.md \
  --estimate-size=true

test -f analysis-sized.md && echo "✅ Size-based analysis created"
grep -q "Hours:" analysis-sized.md && echo "✅ Has hour estimates"
grep -q "Days:" analysis-sized.md && echo "✅ Has day estimates"
```

---

## Test 4: JSON Output Format

Purpose: Programmatic output for pipelines

```bash
npx eslint-plugin-ai-code-snifftest analyze \
  --input=lint-results.json \
  --output=analysis.json \
  --format=json

test -f analysis.json && echo "✅ JSON analysis created"

# Validate structure
node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync('analysis.json','utf8'));console.log('✅ Valid JSON');console.log('Has categories:',d.categories? '✅':'❌');console.log('Has summary:',d.summary? '✅':'❌');"
```

---

## Test 5: HTML Output Format

Purpose: Human-friendly browser report

```bash
npx eslint-plugin-ai-code-snifftest analyze \
  --input=lint-results.json \
  --output=analysis.html \
  --format=html

test -f analysis.html && echo "✅ HTML analysis created"
grep -q "<html" analysis.html && echo "✅ Valid HTML document"
grep -q "<body" analysis.html && echo "✅ Has body tag"
```

---

## Test 6: GitLab CLI Instructions (Optional)

Purpose: Validate GitLab-specific CLI snippets

```bash
npx eslint-plugin-ai-code-snifftest create-issues \
  --input=lint-results.json \
  --output=issues-gitlab \
  --include-commands=gitlab-cli \
  --labels="lint,tech-debt,quality"

test -f issues-gitlab/00-README.md && echo "✅ GitLab issues created"
if command -v glab >/dev/null 2>&1; then
  grep -q "glab issue create" issues-gitlab/00-README.md && echo "✅ GitLab CLI present"
else
  echo "ℹ️  glab not installed; CLI verification skipped"
fi
grep -q "lint,tech-debt,quality" issues-gitlab/00-README.md && echo "✅ Custom labels present"
```

---

## Test 7: Custom Phase Count

Purpose: Roadmap phases are configurable

```bash
npx eslint-plugin-ai-code-snifftest plan \
  --input=lint-results.json \
  --output=FIXES-3PHASES.md \
  --phases=3

npx eslint-plugin-ai-code-snifftest plan \
  --input=lint-results.json \
  --output=FIXES-6PHASES.md \
  --phases=6

grep -c "^## Phase" FIXES-3PHASES.md | awk '{if($1==3) print "✅ 3 phases correct"; else print "❌ Expected 3, got "$1}'

grep -c "^## Phase" FIXES-6PHASES.md | awk '{if($1==6) print "✅ 6 phases correct"; else print "❌ Expected 6, got "$1}'
```

---

## Test 8: Example Count Control

Purpose: Verify --max-examples limits code snippets

```bash
npx eslint-plugin-ai-code-snifftest analyze \
  --input=lint-results.json \
  --output=analysis-few-examples.md \
  --max-examples=2

echo "Few examples:"; grep -c '```' analysis-few-examples.md || true

npx eslint-plugin-ai-code-snifftest analyze \
  --input=lint-results.json \
  --output=analysis-many-examples.md \
  --max-examples=10

echo "Many examples:"; grep -c '```' analysis-many-examples.md || true
```

---

## Test 9: Domain Detection Validation (CRITICAL)

Purpose: Domains must come from `.ai-coding-guide.json`, not violations

```bash
cat > .ai-coding-guide.json << 'EOF'
{
  "domains": {
    "primary": "astronomy",
    "additional": ["physics", "math"]
  },
  "domainPriority": ["astronomy", "physics", "math"]
}
EOF

npx eslint-plugin-ai-code-snifftest analyze --input=lint-results.json --output=domain-test.md

# Top Domains section should list only astronomy/physics/math
awk '/^## Top Domains/{f=1;next} /^$|^###/{f=0} f' domain-test.md | sed 's/^[- ]\{1,\}//' | cut -d: -f1 | tr -d ' ' > .top_domains

comm -3 <(printf "astronomy\nmath\nphysics\n" | sort) <(sort .top_domains) | wc -l | awk '{ if($1==0) print "✅ Uses config domains"; else print "❌ Unexpected domains in Top Domains" }'

# Ensure no detected domains (e.g., biology/graphics) appear in Top Domains
grep -qiE "^[-] (biology|graphics)" domain-test.md && echo "❌ Detected domains leaked into Top Domains" || echo "✅ No leaked detected domains"
```

---

## Test 10: One-Liner End-to-End

Purpose: Smoke test with custom options

```bash
cd /Users/dougfennell/vscode/projects/eslint-plugin-ai-code-snifftest && \
  npx eslint-plugin-ai-code-snifftest setup --yes --primary=dev-tools --additional=cli,linting && \
  npx eslint . --format json > lint-results.json 2>&1 || true && \
  npx eslint-plugin-ai-code-snifftest analyze \
    --input=lint-results.json \
    --output=analysis-report.md \
    --top-files=10 \
    --min-count=2 \
    --max-examples=5 \
    --estimate-size=true && \
  npx eslint-plugin-ai-code-snifftest plan \
    --input=lint-results.json \
    --output=FIXES-ROADMAP.md \
    --phases=4 \
    --top-files=10 \
    --min-count=2 && \
  npx eslint-plugin-ai-code-snifftest create-issues \
    --input=lint-results.json \
    --output=issues \
    --format=markdown \
    --include-commands=github-cli \
    --labels="lint,tech-debt,dogfood" \
    --top-files=10 \
    --min-count=2 && \
  echo "✅ Dogfood complete! Check analysis-report.md, FIXES-ROADMAP.md, and issues/"
```

---

## Test 11: Empty Violations (Edge Case)

Purpose: Graceful behavior with no input items

```bash
echo '[]' > lint-empty.json
npx eslint-plugin-ai-code-snifftest analyze --input=lint-empty.json --output=analysis-empty.md
npx eslint-plugin-ai-code-snifftest plan --input=lint-empty.json --output=plan-empty.md
npx eslint-plugin-ai-code-snifftest create-issues --input=lint-empty.json --output=issues-empty

# Expectations: no crash, 0 counts, README exists
grep -q "Errors: 0" analysis-empty.md && echo "✅ Empty analysis shows 0"
test -f plan-empty.md && echo "✅ Empty plan created"
test -f issues-empty/00-README.md && echo "✅ Empty issues README created"
```

---

## Test 12: Malformed Input (Error Handling)

Purpose: Clear error messaging and non-zero exit codes

```bash
echo 'not json' > lint-invalid.json
rm -f lint-missing.json

# Should report errors (exit code non-zero); we only check messaging here
npx eslint-plugin-ai-code-snifftest analyze --input=lint-invalid.json 2>&1 | grep -iE "error|invalid" && echo "✅ Invalid JSON reported" || echo "❌ Missing invalid JSON error"

npx eslint-plugin-ai-code-snifftest analyze --input=lint-missing.json 2>&1 | grep -iE "error|not found|ENOENT" && echo "✅ Missing file reported" || echo "❌ Missing 'file not found' error"
```

---

## Test 13: Issues Content Quality

Purpose: Ensure issues include Examples and (when applicable) Domain Hints

```bash
# Recreate issues using current lint-results.json
rm -rf issues
npx eslint-plugin-ai-code-snifftest create-issues --input=lint-results.json --output=issues

# At least one Examples section
grep -q "^### Examples" issues/*.md && echo "✅ Examples present" || echo "❌ Missing Examples sections"

# If all Top Domain counts are zero in analysis, Domain Hints should appear in issues
all_zero=$(awk '/^## Top Domains/{f=1;next} /^$|^###/{f=0} f' analysis-report.md | awk -F: '{gsub(/ /,""); if($2=="0") z++} END{print z+0}')
lines=$(awk '/^## Top Domains/{f=1;next} /^$|^###/{f=0} f' analysis-report.md | wc -l | tr -d ' ')
if [ "$lines" -gt 0 ] && [ "$all_zero" -eq "$lines" ]; then
  grep -q "^### Domain Hints" issues/*.md && echo "✅ Domain Hints present (all zero)" || echo "❌ Expected Domain Hints when Top Domains are all zero"
else
  echo "ℹ️  Top Domains not all zero; Domain Hints in issues may be omitted by design"
fi
```

---

## Test 14: Performance Snapshot (Non-fatal)

Purpose: Record execution time; warn if slow

```bash
start=$(date +%s)

npx eslint-plugin-ai-code-snifftest analyze --input=lint-results.json --output=/tmp/analysis-perf.md
npx eslint-plugin-ai-code-snifftest plan --input=lint-results.json --output=/tmp/plan-perf.md
npx eslint-plugin-ai-code-snifftest create-issues --input=lint-results.json --output=/tmp/issues-perf

end=$(date +%s); dur=$((end-start))
echo "⏱️  Total workflow seconds: $dur"
[ "$dur" -le 30 ] && echo "✅ Under 30s target" || echo "⚠️  Over 30s target"
```

---

## Cleanup

```bash
# Remove generated artifacts
rm -f .ai-coding-guide.json AGENTS.md eslint.config.mjs
rm -f lint-results.json analysis*.md analysis*.json analysis*.html
rm -f FIXES-ROADMAP*.md
rm -rf issues issues-*

# Restore original tracked configs if needed
git checkout -- .ai-coding-guide.json AGENTS.md eslint.config.mjs 2>/dev/null || true
```

---

## Automated Test Runner (bash)

The following block can be executed directly via sed as noted at the top.

```bash
run_test() {
  local name="$1"; shift
  local cmd="$*"
  echo "\n---\nRunning: $name\n---"
  if eval "$cmd" >/dev/null 2>&1; then
    echo "✅ PASS: $name"
    TESTS_PASSED=$((TESTS_PASSED+1))
  else
    echo "❌ FAIL: $name"
    TESTS_FAILED=$((TESTS_FAILED+1))
  fi
}

# Strict bash and init
set -euo pipefail
TESTS_PASSED=0
TESTS_FAILED=0
ROOT="${ROOT_OVERRIDE:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$ROOT"

# 0) Clean slate (idempotent)
run_test "Clean slate" "rm -f .ai-coding-guide.json AGENTS.md eslint.config.mjs lint-results.json && rm -f analysis-report.md FIXES-ROADMAP.md && rm -rf issues issues-*"

# 1) Setup
run_test "Setup" "npx eslint-plugin-ai-code-snifftest setup --yes --primary=dev-tools --additional=cli,linting"

# 2) Lint (allow non-zero exit)
run_test "ESLint JSON export" "npx eslint . --format json > lint-results.json 2>&1 || true; test -s lint-results.json"

# 3) Analyze (default)
run_test "Analyze (default)" "npx eslint-plugin-ai-code-snifftest analyze --input=lint-results.json && grep -q '^## Categories' analysis-report.md"

# 4) Plan
run_test "Plan" "npx eslint-plugin-ai-code-snifftest plan --input=lint-results.json && test -f FIXES-ROADMAP.md || test -f FIXES-ROADMAP.md"

# 5) Create issues
run_test "Create issues" "npx eslint-plugin-ai-code-snifftest create-issues --input=lint-results.json && test -f issues/00-README.md"

# 6) Domain enforcement (Configured Domains from config)
run_test "Configured Domains come from config (not violations)" "awk '/^## Configured Domains/{f=1;next} /^$|^###/{f=0} f' analysis-report.md | sed 's/^[- ]\{1,\}//' | cut -d: -f1 | tr -d ' ' | sed 's/(primary)//' | sed 's/(additional)//' | tr -d ' ' > .top && grep -qx 'dev-tools' .top && grep -qx 'cli' .top && grep -qx 'linting' .top"

# 7) Issues quality: Examples present
run_test "Issues contain Examples" "grep -q '^### Examples' issues/*.md"

# 8) If Top Domains all zero, Domain Hints appear in issues
run_test "Issues include Domain Hints when Top Domains all zero" "lines=$(awk '/^## Top Domains/{f=1;next} /^$|^###/{f=0} f' analysis-report.md | wc -l | tr -d ' '); zeros=$(awk '/^## Top Domains/{f=1;next} /^$|^###/{f=0} f' analysis-report.md | awk -F: '{gsub(/ /,""); if($2=="0") z++} END{print z+0}'); if [ "${lines:-0}" -gt 0 ] && [ "${zeros:-0}" -eq "${lines:-0}" ]; then grep -q '^### Domain Hints' issues/*.md; else true; fi"

# 9) JSON format available
run_test "Analyze JSON output" "npx eslint-plugin-ai-code-snifftest analyze --input=lint-results.json --output=analysis.json --format=json && test -s analysis.json"

# Summary
echo "\n=========================================================="
echo "Test Results: ${TESTS_PASSED} passed, ${TESTS_FAILED} failed"
echo "=========================================================="

exit $TESTS_FAILED
```
