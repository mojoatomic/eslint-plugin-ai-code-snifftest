# Flag generic names; enforce domain-specific naming (`ai-code-snifftest/no-generic-names`)

<!-- end auto-generated rule header -->

Flags generic identifiers like `data`, `result`, `temp`, or those containing forbidden domain terms (e.g., `song`) based on your project’s `.ai-coding-guide.json` or rule options.

Note: Names that already include recognized domain terms (from the constants library/config) are skipped to avoid penalizing domain-rich identifiers (e.g., `orbitalResult`, `audioData`).

## Rule Details

This rule aims to encourage descriptive, domain-appropriate names.

## Options

- `forbiddenNames` (array of strings) — exact names to disallow
- `forbiddenTerms` (array of strings) — disallow identifiers containing these substrings (case-insensitive)

## Examples

### ❌ Incorrect

```js
const data = fetch();
function result(){}
const songFilePath = "/a/b";
```

### ✅ Correct

```js
const track = fetchTrack();
function userProfile(){}
const audioPath = "/a/b"; // if song is forbidden term
```