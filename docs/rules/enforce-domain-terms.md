# Encourage domain-specific naming using declared project terms (`ai-code-snifftest/enforce-domain-terms`)

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Promotes domain-specific naming by encouraging identifiers to include declared domain terms from `.ai-coding-guide.json` (or rule options). Provides suggestions using those terms.

## Rule Details

This rule checks identifiers for the presence of configured domain terms (e.g., `orbit`, `velocity`, `payment`). If an identifier lacks any of these terms and is not exempted, the rule reports it and suggests domain-aligned alternatives.

## Options

- `requiredTerms` (string[]) — additional domain terms to enforce
- `preferredNames` (string[]) — optional list of recommended names to prioritize in suggestions
- `exemptNames` (string[]) — identifiers to skip entirely
- `maxSuggestions` (number) — cap the number of suggestions (default: 3)

## Examples

### ❌ Incorrect

```js
const data = 1;
function value(){}
class Item {}
```

### ✅ Correct

```js
const orbitPeriod = 27.3;
function calculateVelocity(){}
class PaymentService {}
```