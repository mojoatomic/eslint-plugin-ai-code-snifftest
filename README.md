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

| Name                                                                   | Description                                                             | 🔧 | 💡 |
| :--------------------------------------------------------------------- | :---------------------------------------------------------------------- | :- | :- |
| [no-equivalent-branches](docs/rules/no-equivalent-branches.md)         | Detect if/else branches that do the same thing                          | 🔧 |    |
| [no-redundant-calculations](docs/rules/no-redundant-calculations.md)   | Detect redundant calculations that should be computed at compile time   | 🔧 |    |
| [no-redundant-conditionals](docs/rules/no-redundant-conditionals.md)   | Simplify redundant conditional expressions                              | 🔧 |    |
| [no-unnecessary-abstraction](docs/rules/no-unnecessary-abstraction.md) | Suggest inlining trivial single-use wrapper functions that add no value |    | 💡 |
| [prefer-simpler-logic](docs/rules/prefer-simpler-logic.md)             | Simplify boolean expressions and remove redundant logic                 | 🔧 |    |

<!-- end auto-generated rules list -->

## Configurations

<!-- begin auto-generated configs list -->
TODO: Run eslint-doc-generator to generate the configs list (or delete this section if no configs are offered).
<!-- end auto-generated configs list -->


