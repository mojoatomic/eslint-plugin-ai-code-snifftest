# Simplify redundant conditional expressions (`ai-code-snifftest/no-redundant-conditionals`)

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).

## Rule Details

This rule detects and simplifies redundant conditional expressions that AI frequently generates:

1. **Constant conditions** - `if (true)`, `if (false)`, `if (1)`, `if (0)`
2. **Boolean tautologies** - `x === true`, `x !== false`
3. **Redundant ternaries** - `x ? true : false`, `x ? value : value`

AI models generate these patterns because they prioritize readability over conciseness and don't optimize for semantic redundancy.

## Examples

### ❌ Incorrect

```javascript
// Constant conditions
if (true) {
  doSomething();
}

if (false) {
  unreachableCode();
}

if (1) {
  alwaysRuns();
}

// Boolean tautologies
if (x === true) {
  doWork();
}

if (isValid !== false) {
  process();
}

if (x === false) {
  handleError();
}

// Redundant ternaries
const result = condition ? true : false;
const inverted = test ? false : true;
const same = x ? value : value;
```

### ✅ Correct

```javascript
// Remove constant conditions
doSomething();

// (if false block is removed entirely)

alwaysRuns();

// Simplify boolean comparisons
if (x) {
  doWork();
}

if (isValid) {
  process();
}

if (!x) {
  handleError();
}

// Simplify ternaries
const result = Boolean(condition);
const inverted = !test;
const same = value;
```

## Patterns Detected

### 1. Constant Conditions

Conditions that always evaluate to the same value:

```javascript
if (true) { }   // Always executes
if (false) { }  // Never executes  
if (1) { }      // Truthy constant
if (0) { }      // Falsy constant
if ("") { }     // Falsy constant
```

**Note:** `while (true)` and `for (;;)` are intentionally allowed as common infinite loop patterns.

### 2. Boolean Tautologies

Redundant comparisons with boolean literals:

```javascript
// These all simplify to just: x
if (x === true) { }
if (true === x) { }
if (x == true) { }
if (x !== false) { }
if (false !== x) { }

// These all simplify to: !x
if (x === false) { }
if (false === x) { }
if (x !== true) { }
if (true !== x) { }
```

### 3. Redundant Ternaries

```javascript
// Boolean ternaries
x ? true : false    → Boolean(x)
x ? false : true    → !x

// Identical branches
x ? value : value   → value
x ? fn() : fn()     → fn()
```

## When Not To Use It

Disable this rule if:

- You use constant conditions for conditional compilation (consider using build tools instead)
- You prefer explicit boolean comparisons for type safety (consider TypeScript instead)
- Your team style guide requires explicit ternary expressions

## Further Reading

- [Truthy and Falsy Values in JavaScript](https://developer.mozilla.org/en-US/docs/Glossary/Truthy)
- [Boolean Coercion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)
- [Conditional (Ternary) Operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator)
