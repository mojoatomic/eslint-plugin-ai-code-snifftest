# Detect redundant calculations that should be computed at compile time (`ai-code-snifftest/no-redundant-calculations`)

🔧💡 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix) and manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Options

- `preserveIntentSuggestion` (boolean, default: `false`)
  - When `true`, the rule offers a suggestion that preserves the original formula and appends the computed value as a trailing comment, for example: `24 * 60 * 60 * 1000 /* = 86400000 */`.

Please describe the origin of the rule here.

## Rule Details

This rule aims to...

Examples of **incorrect** code for this rule:

```js

// fill me in

```

Examples of **correct** code for this rule:

```js

// fill me in

```

## When Not To Use It

Give a short description of when it would be appropriate to turn off this rule.

## Further Reading

If there are other links that describe the issue this rule addresses, please include them here in a bulleted list.
