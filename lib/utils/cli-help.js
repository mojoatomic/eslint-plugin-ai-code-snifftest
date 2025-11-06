'use strict';

function usage() {
  console.log('Usage: eslint-plugin-ai-code-snifftest <command> [options]\n\nCommands:\n  init     Generate configuration and AI coding guides\n  learn    Analyze your project and detect patterns\n  setup    Run learn then init (generate everything by default)\n  scaffold Create external constants package template\n\nQuick Start:\n  # One-command setup\n  $ npx eslint-plugin-ai-code-snifftest setup --yes\n\n  # Or run steps\n  $ npx eslint-plugin-ai-code-snifftest learn --interactive\n  $ npx eslint-plugin-ai-code-snifftest init\n\nCommon Options:\n  --primary=DOMAIN      Set primary domain (e.g., web-app, cli)\n  --additional=a,b      Set additional domains\n  --no-agents           Skip generating AGENTS.md (default: on)\n  --no-eslint           Skip generating eslint.config.mjs (default: on)\n  --cursor              Generate .cursorrules (optional)\n  --interactive         Interactive analysis mode (learn)\n  --yes                 Non-interactive (auto-apply in setup; defaults in init)\n  --arch / --no-arch    Enable/disable architecture guardrails (default: enabled)\n\nMore: docs/CLI.md\n');
}

module.exports = { usage };
