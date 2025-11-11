# Suggest inlining trivial single-use wrapper functions that add no value (`ai-code-snifftest/no-unnecessary-abstraction`)

⚠️ This rule _warns_ in the `permissive-start` config.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

💡 This rule provides suggestions for code improvements.

## Rule Details

This rule detects trivial wrapper functions that:
- Are called exactly once in the codebase
- Only return a single function call
- Pass through parameters without transformation
- Add no additional logic or side effects

Such functions create unnecessary indirection and reduce code clarity. The rule suggests inlining them at their call site.

Examples of **incorrect** code for this rule:

```js
// Trivial wrapper called once
function calculateTax(amount) {
  return getTax(amount);
}
function getTax(amount) {
  return amount * 0.08;
}
calculateTax(100);

// Arrow function wrapper
const wrapper = (x) => {
  return compute(x);
};
function compute(x) { return x * 2; }
wrapper(5);

// Method call wrapper
function getLength(arr) {
  return arr.length();
}
const a = { length() { return 5; } };
getLength(a);
```

Examples of **correct** code for this rule:

```js
// Function used multiple times
function helper(x) { return x * 2; }
helper(5);
helper(10);

// Function with additional logic
function calculateTax(amount) {
  console.log('Calculating tax');
  return getTax(amount);
}
function getTax(amount) { return amount * 0.08; }
calculateTax(100);

// Function transforms arguments
function wrapper(x) {
  return compute(x * 2);
}
function compute(x) { return x + 1; }
wrapper(5);

// Different number of parameters
function wrapper(x) {
  return compute(x, 10);
}
function compute(a, b) { return a + b; }
wrapper(5);
```

## When Not To Use It

Disable this rule if:
- Wrapper functions serve as semantic abstractions even when trivial
- Your codebase prioritizes stable public APIs over internal simplicity
- Function names provide important documentation value

## Further Reading

- [Code Smell: Speculative Generality](https://refactoring.guru/smells/speculative-generality)
- [YAGNI Principle](https://martinfowler.com/bliki/Yagni.html)
