# Dual-suite deterministic tests

Use dual suites when a rule or utility’s behavior depends on configuration. This makes tests deterministic and CI-stable.

## Precedence (how config is resolved)
- RuleTester settings: `context.settings['ai-code-snifftest']`
- Env override: `AI_SNIFFTEST_CONFIG_JSON` (JSON string)
- Disk: `.ai-coding-guide.json`

## Pattern (RuleTester)
```js
const RuleTester = require('eslint').RuleTester;
const tester = new RuleTester({ languageOptions: { ecmaVersion: 2021, sourceType: 'module' } });
const inject = (overrides) => (tc) => ({ ...tc, settings: { 'ai-code-snifftest': overrides } });

// Example: no-redundant-calculations
tester.run('no-redundant-calculations [extConst=true]', rule, {
  valid: [ /* ... */ ].map(inject({ experimentalExternalConstants: true })),
  invalid: [ /* ... */ ].map(inject({ experimentalExternalConstants: true })),
});

tester.run('no-redundant-calculations [extConst=false]', rule, {
  valid: [ /* minimal */ ],
  invalid: [ inject({ experimentalExternalConstants: false })({ code: 'const result = 5*4*3;', errors: [{ messageId: 'redundantCalculation' }], output: 'const result = 60;' }) ],
});
```

## When to use
- Config-sensitive rules: enforce-domain-terms, no-generic-names, enforce-naming-conventions
- Utilities with env/disk behavior: discover-constants, merge-constants (use env instead of RuleTester)

## Suite naming
- `rule-name [rich]` vs `rule-name [minimal]`
- `enforce-naming-conventions [camel+prefix]` vs `[tweaked]`
- `no-redundant-calculations [extConst=true|false]`

## Suggestions
If the rule reports suggestions, include an explicit `suggestions` array for each error with `messageId` and `output`.

## Env-based tests (utilities)
For non-RuleTester utilities, set env in the test:
```js
process.env.AI_CONSTANTS_NO_CACHE = '1';
// call function and assert recomputation occurred
```
