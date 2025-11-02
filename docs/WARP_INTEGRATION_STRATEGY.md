# Warp Integration Strategy

- Generate AGENTS.md (condensed, cross-tool); never touch WARP.md; no symlinks
- Wizard detects WARP.md and defaults to creating AGENTS.md, plus `.ai-coding-guide.{json,md}`, `.cursorrules`, and `eslint.config.js`
- README documents setup; flags: `--agents`, `--md`, `--cursor`

Why this works:
- Warp reads AGENTS.md; WARP.md remains Warp-managed
- Clean separation; maximum compatibility with Cursor/Claude/others
- Token-efficient, quick-reference in AGENTS.md; detailed reference in `.ai-coding-guide.md`