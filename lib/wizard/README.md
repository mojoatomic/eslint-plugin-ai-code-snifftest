# Wizard Helpers

This directory contains interactive helper modules used by the CLI:
- `prompts.js`: minimal prompt utilities (ask, confirm, selectFromList)
- `domain-selector.js`: builds domain metadata (counts, sources) from the constants library

The CLI (`bin/cli.js`) remains a thin router and delegates interactive logic here.