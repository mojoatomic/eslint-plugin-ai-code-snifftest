# eslint-plugin-ai-code-snifftest

Does your AI-generated code pass the sniff test? Detect and fix AI code smell.

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-ai-code-snifftest`:

```sh
npm install eslint-plugin-ai-code-snifftest --save-dev
```

## Usage

In your [configuration file](https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file), import the plugin `eslint-plugin-ai-code-snifftest` and add `ai-code-snifftest` to the `plugins` key:

```js
import { defineConfig } from "eslint/config";
import ai-code-snifftest from "eslint-plugin-ai-code-snifftest";

export default defineConfig([
    {
        plugins: {
            ai-code-snifftest
        }
    }
]);
```



## Rules

<!-- begin auto-generated rules list -->

🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).\
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

| Name                                                                   | Description                                                                                        | 🔧 | 💡 |
| :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- | :- | :- |
| [enforce-domain-terms](docs/rules/enforce-domain-terms.md)             | Encourage domain-specific naming using declared project terms                                      |    | 💡 |
| [enforce-naming-conventions](docs/rules/enforce-naming-conventions.md) | Enforce naming conventions from project config (style, boolean/async prefixes, plural collections) |    | 💡 |
| [no-equivalent-branches](docs/rules/no-equivalent-branches.md)         | Detect if/else branches that do the same thing                                                     | 🔧 |    |
| [no-generic-names](docs/rules/no-generic-names.md)                     | Flag generic names; enforce domain-specific naming                                                 |    |    |
| [no-redundant-calculations](docs/rules/no-redundant-calculations.md)   | Detect redundant calculations that should be computed at compile time                              | 🔧 | 💡 |
| [no-redundant-conditionals](docs/rules/no-redundant-conditionals.md)   | Simplify redundant conditional expressions                                                         | 🔧 |    |
| [no-unnecessary-abstraction](docs/rules/no-unnecessary-abstraction.md) | Suggest inlining trivial single-use wrapper functions that add no value                            |    | 💡 |
| [prefer-simpler-logic](docs/rules/prefer-simpler-logic.md)             | Simplify boolean expressions and remove redundant logic                                            | 🔧 |    |

<!-- end auto-generated rules list -->

## Usage with Prettier

This plugin is **fully compatible with Prettier**. Our auto-fixes focus on logical simplification (not formatting), so they work seamlessly with Prettier's formatting.

### Recommended Workflow

Run ESLint before Prettier for best results:

```json
{
  "scripts": {
    "lint": "eslint --fix . && prettier --write .",
    "lint:check": "eslint . && prettier --check ."
  }
}
```

### Integrated Setup (Alternative)

For a seamless experience, use `eslint-plugin-prettier` to run both tools together:

```bash
npm install --save-dev eslint-plugin-prettier eslint-config-prettier prettier
```

```javascript
// eslint.config.js
import prettier from 'eslint-plugin-prettier';
import aiSnifftest from 'eslint-plugin-ai-code-snifftest';

export default [
  {
    plugins: {
      'ai-code-snifftest': aiSnifftest,
    },
    rules: {
      'ai-code-snifftest/no-redundant-calculations': 'error',
      'ai-code-snifftest/no-equivalent-branches': 'error',
      'ai-code-snifftest/prefer-simpler-logic': 'error',
      'ai-code-snifftest/no-redundant-conditionals': 'error',
      'ai-code-snifftest/no-unnecessary-abstraction': 'warn',
    },
  },
  prettier.configs.recommended,  // Prettier runs after our rules
];
```

Now a single command handles both:

```bash
eslint --fix .  # Fixes logic AND formats code
```

### How It Works

Our plugin focuses on **logical simplification** (`type: 'suggestion'`), not formatting (`type: 'layout'`). 

ESLint automatically applies fixes in this order:
1. **Problem rules** (bugs)
2. **Suggestion rules** ← Our plugin fixes logic here
3. **Layout rules** (whitespace) ← Prettier formats here

This ensures no conflicts! ✅

**Verified:** All rules tested with Prettier 3.x compatibility suite (18 integration tests).

## Configurations

### Migration to v2 (Multi-domain)
See docs/migration/v2.md for details. For new projects, use the CLI wizard:

```bash
eslint-plugin-ai-code-snifftest init --primary=astronomy --additional=geometry,math,units --md --cursor
```

<!-- begin auto-generated configs list -->
TODO: Run eslint-doc-generator to generate the configs list (or delete this section if no configs are offered).
<!-- end auto-generated configs list -->


