# Commands (Planned Extraction)

The CLI is moving toward a thin router architecture (see issue #76). Command implementations
(`init`, `learn`, `scaffold`) will live here. For now, `init` and `scaffold` are implemented
in `bin/cli.js` while wizard interactions are under `lib/wizard/`.