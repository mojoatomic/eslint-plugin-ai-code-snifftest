# Enforce naming conventions from project config (style, boolean/async prefixes, plural collections) (`ai-code-snifftest/enforce-naming-conventions`)

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Enforces naming conventions configured in your `.ai-coding-guide.json` (or rule options):
- naming.style (camelCase, snake_case, PascalCase)
- booleanPrefix (e.g., is/has)
- asyncPrefix (e.g., fetch/load)
- pluralizeCollections (arrays, Set/Map)

Provides suggestions to align names; fixes are applied only at the declaration site.

## Options

- `style`: 'camelCase' | 'snake_case' | 'PascalCase'
- `booleanPrefix`: string[]
- `asyncPrefix`: string[]
- `pluralizeCollections`: boolean
- `exemptNames`: string[]
- `maxSuggestions`: number (default 1)

## Examples

### ❌ Incorrect
```js
const user_profile = 1;
const active = true;
async function user(){}
const user = [];
```

### ✅ Correct
```js
const userProfile = 1;
const isActive = true;
async function fetchUser(){}
const users = [];
```