# [Phase 2] Improve Domain Terms

Align terminology with configured domains.

### Detected Domains
- dev-tools: 0
- cli: 0
- linting: 0

### Domain Hints
- biology: 76
- graphics: 60
- photo: 32
- cs: 22
- finance: 8

### Terminology to Review
- unknown
- Generic name "result" - use a domain-specific term
- Generic name "list" - use a domain-specific term
- Generic name "list" - use a domain-specific term
- Generic name "arr" - use a domain-specific term
- Generic name "arr" - use a domain-specific term

### Examples
- result → (domain-specific)

```js

        // Evaluate the expression
        const result = evaluateTree(node);

        if (result === null) {
```

- list → (domain-specific)

```js
      lines.push('');
    }
    const list = (cats.complexity || []).slice(0, Math.min(5, maxExamples || 5));
    if (list.length) {
      lines.push('### Examples');
```

- list → (domain-specific)

```js
      lines.push('');
    }
    const list = (cats.architecture || []).slice(0, Math.min(5, maxExamples || 5));
    if (list.length) {
      lines.push('### Examples');
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

### Acceptance Criteria
- [ ] Named constants exist for top recurring numeric values
- [ ] Domain terminology aligns with catalog (and project conventions)
- [ ] Complexity hotspots have clear refactor plans
- [ ] Architecture limits are respected
