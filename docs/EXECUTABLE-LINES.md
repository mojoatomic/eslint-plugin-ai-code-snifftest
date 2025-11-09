# Executable Line Metrics (exLOC)

- Purpose: measure code, not comments. Encourages documentation without inflating length metrics.
- Metrics emitted in analysis JSON under `lines`:
  - `physical`: total lines
  - `executable`: comment/blank-excluded lines
  - `comments`: physical - executable
  - `commentRatio`: comments / physical

Configuration (.ai-coding-guide.json)
- `ratchet.lineCountMode`: "executable" | "physical" (telemetry default: executable)
- `ratchet.metrics.trackPhysicalLines` (default true)
- `ratchet.metrics.trackExecutableLines` (default true)
- `ratchet.metrics.trackCommentRatio` (default true)

CI/Telemetry
- The traditional ratchet gate is unchanged (counts still gate).
- Ratchet now prints a non-blocking Lines section with physical/executable deltas and comment ratio.

Notes
- Regex-based comment stripping is best-effort for telemetry. We can adopt AST-based parsing later if needed.
