# AI Enrichment Prompt for Creating GitHub Issues

Use this prompt to generate enhanced, production-ready GitHub issues from the analysis artifacts produced by eslint-plugin-ai-code-snifftest.

## How to Use

1) Attach these files to your AI assistant (Claude, Cursor, ChatGPT, Copilot Chat, etc.):
- .ai-coding-guide.json
- AGENTS.md
- analysis.json
- lint-results.json
- All files from issues/ (skip 00-README.md)

2) Copy-paste the entire prompt below into your AI session.

---

## Prompt (copy/paste)

```text
You are creating production-ready GitHub issues for tech debt remediation.

I have generated a comprehensive ESLint analysis with these files:

CONFIGURATION FILES:
- .ai-coding-guide.json: Domain rules, architecture limits, forbidden names
- AGENTS.md: Project coding patterns, anti-patterns, terminology

DATA FILES:
- analysis.json: Violation counts, effort estimates, categorization
- lint-results.json: Raw ESLint output with exact file paths and line numbers

ISSUE TEMPLATES:
- issues/*.md: Rich markdown with violations, examples, and strategies

Your task: For EACH .md file in issues/ (skip 00-README.md), enhance it into a 
perfect GitHub issue by:

1. KEEPING all existing data (counts, files, line numbers, examples)
2. ADDING domain-specific context:
   - Reference specific patterns from AGENTS.md
   - Explain WHY violations matter using project principles
   - Use terminology from .ai-coding-guide.json

3. ENHANCING fix strategies:
   - Make strategies specific to this project's patterns
   - Reference exact sections of AGENTS.md (e.g., "See AGENTS.md 'CLI Style'")
   - Show before/after using project conventions

4. IMPROVING verification steps:
   - Add project-specific commands
   - Reference architecture limits from .ai-coding-guide.json
   - Include success criteria

5. FORMATTING for readability:
   - Use clear headers
   - Bold key numbers
   - Code blocks for examples
   - Bullet points for steps

OUTPUT FORMAT:

For each issue, provide:

A) GitHub CLI Command:
```bash
gh issue create \
  --title "EXACT_TITLE" \
  --label "tech-debt,phase-X" \
  --body "$(cat <<'EOF'
[FULL ENHANCED MARKDOWN HERE]
EOF
)"
```

B) The enhanced markdown (ready to copy/paste)

CRITICAL REQUIREMENTS:

✅ Keep ALL data from original .md (don't summarize or remove)
✅ Use domain-specific terminology from .ai-coding-guide.json
✅ Reference specific AGENTS.md sections by name
✅ Make fix strategies actionable (not generic advice)
✅ Include exact file paths and line numbers
✅ Show real code examples from the violations
✅ Add verification commands that work for this project
✅ Use relative paths (strip absolute user-specific prefixes)

❌ Don't add placeholder text or TODOs
❌ Don't make up data not in the files
❌ Don't remove violation details or file lists
❌ Don't give generic advice ("improve code quality")

Start with issues/02-phase1-auto-fix.md and process each file sequentially.


LABELING RULES (per file)
- issues/01-phase1-magic-numbers.md     → labels: tech-debt, phase-1, magic-numbers
- issues/02-phase1-auto-fix.md          → labels: tech-debt, phase-1, auto-fix
- issues/03-phase2-domain-terms.md      → labels: tech-debt, phase-2, domain-terms
- issues/04-phase3-complexity.md        → labels: tech-debt, phase-3, complexity
- issues/05-phase4-architecture.md      → labels: tech-debt, phase-4, architecture

TITLE + PATH RULES
- EXACT_TITLE = the first H1 line from the file (strip leading "# ")
- Convert all absolute file paths to repo-relative (e.g., "lib/commands/...")
- Preserve line numbers exactly as in the source files

OUTPUT CONTRACT (multi-issue)
For EACH issue file (skip 00-README.md), output in this exact order:

=== ISSUE BEGIN: <basename.md> ===
A) GitHub CLI Command:
```bash
gh issue create \
  --title "EXACT_TITLE" \
  --label "LABELS_FROM_RULES" \
  --body "$(cat <<'EOF'
[FULL ENHANCED MARKDOWN HERE]
EOF
)"
```

B) Enhanced Markdown (verbatim body rendered above)
[PASTE THE SAME MARKDOWN BODY HERE FOR READABILITY]
=== ISSUE END ===

SANITY CHECKS (must satisfy before output)
- Preserve original counts, file lists, and examples from the markdown
- Keep relative paths; no absolute user-specific prefixes
- Reference AGENTS.md sections by name where relevant (e.g., "CLI Style", "Anti-Patterns", "Async Style")
- Use terminology and limits from .ai-coding-guide.json (e.g., max function length/complexity)
- Strategies must be actionable and project-specific (not generic)
- Verification must include runnable commands for this repo
- No placeholders, no TODOs, no invented data

PROCESS ORDER
Start with issues/02-phase1-auto-fix.md, then process remaining files sequentially in numeric order.
```
