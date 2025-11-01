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



## Configurations

<!-- begin auto-generated configs list -->
TODO: Run eslint-doc-generator to generate the configs list (or delete this section if no configs are offered).
<!-- end auto-generated configs list -->


