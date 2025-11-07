# [Phase 2] Improve Domain Terms

Align terminology with configured domains.

## Problem Statement
Generic names hide intent and slow maintenance. Per AGENTS.md:
- Naming: prefer domain-specific terms over generic (`result`, `arr`, `tmp`, `data`, `value`)
- Anti-Patterns: avoid generic names; reveal intent
- File Organization: feature-based structure benefits from precise terminology

Using .ai-coding-guide.json, adopt domain-appropriate terms for dev-tools/cli/linting.

### Configured Domains
- dev-tools (primary)
- cli (additional)
- linting (additional)

## Summary
**72** violations found across **30** file(s).

**Priority:** High (terms)

## Violations Breakdown

### By Rule
- `ai-code-snifftest/no-generic-names`: 72 occurrences

### By Generic Name
- `tmp`: 28 occurrences
- `result`: 25 occurrences → ruleResult, validationResult, parseResult
- `value`: 8 occurrences
- `arr`: 5 occurrences → violations, rules, constants
- `data`: 3 occurrences → ruleData, configData, parserData

### Examples
- result → (domain-specific)

```js

        // Evaluate the expression
        const result = evaluateTree(node);

        if (result === null) {
```

- arr → (domain-specific)

```js
    for (const r of list) {
      const k = rel(r.filePath);
      const arr = m.get(k) || [];
      arr.push(r);
      m.set(k, arr);
```

- arr → (domain-specific)

```js
  const out = [];
  for (const [domain, mod] of Object.entries(DOMAINS)) {
    const arr = Array.isArray(mod.constants) ? mod.constants : [];
    for (const v of arr) {
      if (typeof v === 'number') out.push({ domain, value: v });
```

- arr → (domain-specific)

```js
  const out = [];
  for (const [domain, mod] of Object.entries(DOMAINS)) {
    const arr = Array.isArray(mod.terms) ? mod.terms : [];
    for (const t of arr) {
      out.push({ domain, term: String(t) });
```

- item → (domain-specific)

```js
          if (!Array.isArray(arr)) continue;
          const set = new Set();
          for (const item of arr) {
            const v = normalizeNumber(item);
            if (v !== null) set.add(v);
```

## Top Files Affected
1. `tests/lib/generators/eslint-arch-config.test.js`: 12 violations
   - Line 11: Generic name "result" - use a domain-specific term
   - Line 18: Generic name "result" - use a domain-specific term
   - Line 30: Generic name "result" - use a domain-specific term

2. `tests/integration/cli-learn-interactive-snapshot.test.js`: 6 violations
   - Line 69: Generic name "tmp" - use a domain-specific term
   - Line 106: Generic name "result" - use a domain-specific term
   - Line 137: Generic name "tmp" - use a domain-specific term

3. `tests/lib/utils/arch-defaults.test.js`: 6 violations
   - Line 36: Generic name "result" - use a domain-specific term
   - Line 53: Generic name "result" - use a domain-specific term
   - Line 66: Generic name "result" - use a domain-specific term

4. `lib/rules/no-redundant-calculations.js`: 4 violations
   - Line 318: Generic name "item" - use a domain-specific term
   - Line 358: Generic name "arr" - use a domain-specific term
   - Line 360: Generic name "item" - use a domain-specific term

5. `lib/rules/no-redundant-conditionals.js`: 4 violations
   - Line 297: Generic name "value" - use a domain-specific term
   - Line 379: Generic name "value" - use a domain-specific term
   - Line 402: Generic name "value" - use a domain-specific term

6. `lib/rules/prefer-simpler-logic.js`: 4 violations
   - Line 53: Generic name "value" - use a domain-specific term
   - Line 70: Generic name "value" - use a domain-specific term
   - Line 92: Generic name "value" - use a domain-specific term

7. `lib/scanner/reconcile.js`: 4 violations
   - Line 29: Generic name "result" - use a domain-specific term
   - Line 57: Generic name "arr" - use a domain-specific term
   - Line 118: Generic name "bool" - use a domain-specific term

8. `tests/integration/cli-init-arch-guardrails.test.js`: 4 violations
   - Line 33: Generic name "tmp" - use a domain-specific term
   - Line 50: Generic name "tmp" - use a domain-specific term
   - Line 67: Generic name "tmp" - use a domain-specific term

9. `tests/integration/cli-init-multi-domains.test.js`: 3 violations
   - Line 23: Generic name "tmp" - use a domain-specific term
   - Line 30: Generic name "tmp" - use a domain-specific term
   - Line 37: Generic name "tmp" - use a domain-specific term

10. `lib/constants/index.js`: 2 violations
   - Line 52: Generic name "arr" - use a domain-specific term
   - Line 63: Generic name "arr" - use a domain-specific term

## Fix Strategy
- Naming (AGENTS.md “Naming”, “Anti-Patterns”)
  - `result` → ruleResult, validationResult, parseResult
  - `arr` → violations, rules, constants
  - `tmp` → tempDirectory, tempConfig, tempResult
  - `data` → ruleData, configData, parserData
  - `value` → ruleValue, configValue, constantValue
- Apply consistently per file to avoid mixed terminology.
- Prefer feature-based names aligned with the module’s purpose (“File Organization”).

## Verification
```bash
npx eslint . --format json > lint-results.json
npx eslint-plugin-ai-code-snifftest analyze --input=lint-results.json
# Optional: count remaining generic-name hits
grep -o '"ruleId":"ai-code-snifftest/no-generic-names"' lint-results.json | wc -l
```

## Success Criteria
- [ ] Violations reduced: 72 → 15 (or 0)
- [ ] Top 5 files addressed
- [ ] Tests green: npm test
- [ ] Patterns in AGENTS.md followed
