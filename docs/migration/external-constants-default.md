# External Constants Default Flip (Planned)

We plan to enable external constants by default (`experimentalExternalConstants: true`) in a future minor release.

What this means:
- Discovery (built-in + npm + local + custom) will be on by default
- Merging with precedence will feed rules and the wizard automatically

How to prepare:
- Add an `externalConstantsAllowlist` to limit npm scope (names or regex strings)
- Keep `constantResolution` mappings for recurring ambiguous values
- Use the CLI `--allowlist` flag to seed allowlist when running `init --external`

Opting out:
- Set `experimentalExternalConstants: false` in `.ai-coding-guide.json` to disable at the project level

Timeline:
- Flip will land once we complete pilot projects and gather stability feedback; announced in release notes
