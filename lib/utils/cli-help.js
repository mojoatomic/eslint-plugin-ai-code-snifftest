'use strict';

function usage() {
  console.log('Usage: eslint-plugin-ai-code-snifftest <command> [options]\n\nCommands:\n  init     Generate configuration and AI coding guides\n  learn    Analyze your project and detect patterns\n  scaffold Create external constants package template\n\nQuick Start:\n  # Analyze code and generate everything\n  $ npx eslint-plugin-ai-code-snifftest learn --interactive\n  $ npx eslint-plugin-ai-code-snifftest init\n\n  # Or specify domain manually\n  $ npx eslint-plugin-ai-code-snifftest init --primary=web-app --yes\n\nCommon Options:\n  --primary=DOMAIN      Set primary domain (e.g., web-app, cli)\n  --additional=a,b      Set additional domains\n  --no-agents           Skip generating AGENTS.md (default: on)\n  --no-eslint           Skip generating eslint.config.mjs (default: on)\n  --cursor              Generate .cursorrules (optional)\n  --interactive         Interactive analysis mode (learn)\n  --yes                 Non-interactive mode (init)\n  --arch / --no-arch    Enable/disable architecture guardrails (default: enabled)\n\nMore: docs/CLI.md\n');
}

module.exports = { usage };
