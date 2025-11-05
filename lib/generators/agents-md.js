'use strict';

const fs = require('fs');
const path = require('path');

function loadConstantsLib() {
  try {
    return require(path.join(__dirname, '../constants'));
  } catch {
    return null;
  }
}

function pickMetaForDomain(mod, max) {
  const items = [];
  if (Array.isArray(mod.constantMeta)) {
    for (const m of mod.constantMeta) {
      if (m && (typeof m.value === 'number' || typeof m.value === 'string')) {
        items.push({ value: m.value, name: m.name, description: m.description });
      }
      if (items.length >= max) break;
    }
  }
  return items;
}

function formatList(title, items) {
  if (!items || !items.length) return '';
  return `### ${title}\n` + items.map((x)=>`- ${x}`).join('\n') + '\n\n';
}

function writeAgentsMd(cwd, cfg) {
  const file = path.join(cwd, 'AGENTS.md');
  const doms = [cfg.domains.primary, ...(cfg.domains.additional||[])].filter(Boolean);
  const lib = loadConstantsLib();
  
  // Detect project context
  const { detectProjectContext } = require(path.join(__dirname, '..', 'utils', 'project-detection'));
  const projectCtx = detectProjectContext(cwd);
  
  // Header with project context
  let md = `# AI Coding Rules\n\n**Project**: ${projectCtx.description}\n**Domains**: ${doms.join(', ')}\n**Priority**: ${cfg.domainPriority.join(' > ')}\n**Tech Stack**: ${projectCtx.techStack.join(', ') || 'Node.js'}\n\n---\n\n## Naming\n- Style: ${cfg.naming.style}\n- Booleans: isX/hasX/shouldX/canX\n- Async: fetchX/loadX/saveX\n\n## Guidance\n- Use @domain/@domains annotations for ambiguous constants\n- Prefer constants/terms from active domains\n\n`;
  if (lib && lib.DOMAINS) {
    for (const d of doms) {
      const mod = lib.DOMAINS[d];
      if (!mod) continue;
      md += `## Domain: ${d}\n`;
      const meta = pickMetaForDomain(mod, 10);
      const cn = Array.isArray(mod.constants) ? mod.constants.slice(0, 10) : [];
      if (meta.length) {
        md += '\n### Constants\n```javascript\n' + meta.map(m=>`const ${m.name || ('K_'+String(m.value).replace(/[^A-Za-z0-9]+/g,'_'))} = ${m.value};${m.description ? ' // '+m.description : ''}`).join('\n') + '\n```\n\n';
      } else if (cn.length) {
        md += '\n### Constants\n```javascript\n' + cn.map(v=>`const K_${String(v).replace(/[^A-Za-z0-9]+/g,'_')} = ${v};`).join('\n') + '\n```\n\n';
      }
      const terms = Array.isArray(mod.terms) ? mod.terms.slice(0, 15) : [];
      if (terms.length) md += formatList('Terminology', terms);
    }
  }
  // Architecture guidelines
  if (cfg.architecture) {
    md += '\n## Architecture Guidelines\n\n';
    const arch = cfg.architecture;
    
    // File organization with concrete examples
    if (arch.fileStructure) {
      md += `## File Organization\n\n**Pattern**: ${arch.fileStructure.pattern} (group by feature, not type)\n\n**Example Structure**:\n\`\`\`\n${projectCtx.type === 'cli' ? 'project/' : projectCtx.type === 'web-app' ? 'src/' : 'lib/'}\n  ${projectCtx.type === 'cli' ? 'bin/\n    cli.js              # Entry point (50-100 lines)\n  lib/\n    commands/           # CLI commands\n      init/\n        index.js        # Orchestrator\n        interactive.js  # User prompts\n      learn/\n        index.js\n        scanner.js\n    generators/         # File generators\n      eslint-config.js\n      agents-md.js\n    utils/              # Shared helpers\n      file-writer.js\n      version.js' : projectCtx.type === 'web-app' ? 'components/         # React/Vue components\n    auth/\n      LoginForm.jsx\n      AuthProvider.jsx\n    dashboard/\n      Dashboard.jsx\n      widgets/\n        Chart.jsx\n  hooks/              # Custom hooks\n    useAuth.js\n    useApi.js\n  utils/              # Shared utilities' : 'commands/           # Core commands\n    init/\n      index.js          # Orchestrator\n      config-builder.js # Business logic\n    validate/\n      index.js\n  generators/         # File generators\n  utils/              # Shared helpers'}\n  tests/              # Tests (co-located or here)\n\`\`\`\n\n**Avoid (Type-based)**:\n\`\`\`\n❌ lib/\n    controllers/        # Groups by layer\n    services/           # Hard to find features\n    models/\n    views/\n\`\`\`\n\n`;
    }
    
    // File length limits as table (Task 3.9)
    if (arch.maxFileLength) {
      md += '## File Length Limits\n\n';
      md += '| File Type | Max Lines | Rationale |\n';
      md += '|-----------|-----------|-----------|';
      md += `\n| CLI entry | ${arch.maxFileLength.cli || 100} | Routing only |\n`;
      md += `| Commands  | ${arch.maxFileLength.command || 150} | Orchestration |\n`;
      md += `| Utilities | ${arch.maxFileLength.util || 200} | Single purpose |\n`;
      md += `| Generators| ${arch.maxFileLength.generator || 250} | Template logic |\n`;
      md += `| Components| ${arch.maxFileLength.component || 300} | UI complexity |\n`;
      md += `| Tests     | ∞ | No limit |\n`;
      md += `| Default   | ${arch.maxFileLength.default || 250} | General files |\n\n`;
    }
    
    // Function limits
    if (arch.functions) {
      md += '**Function Limits:**\n';
      md += `- Max length: ${arch.functions.maxLength || 50} lines\n`;
      md += `- Max complexity: ${arch.functions.maxComplexity || 10}\n`;
      md += `- Max depth: ${arch.functions.maxDepth || 4}\n`;
      md += `- Max parameters: ${arch.functions.maxParams || 4}\n`;
      md += `- Max statements: ${arch.functions.maxStatements || 30}\n\n`;
    }
    
    // Patterns
    if (arch.patterns) {
      md += '**Code Patterns:**\n';
      md += `- CLI style: ${arch.patterns.cliStyle || 'orchestration-shell'}\n`;
      md += `- Error handling: ${arch.patterns.errorHandling || 'explicit'}\n`;
      md += `- Async style: ${arch.patterns.asyncStyle || 'async-await'}\n\n`;
    }
  }
  
  // Code Patterns with Examples (Task 3.3)
  md += '\n## Code Patterns\n\n';
  if (projectCtx.type === 'cli' || projectCtx.type === 'dev-tools') {
    md += '### CLI Style\n```javascript\n// ✅ Good: Orchestration shell\nasync function main() {\n  const args = parseArgs(process.argv);\n  const command = commands[args._[0]];\n  await command(process.cwd(), args);\n}\n\n// ❌ Bad: Business logic in CLI\nasync function main() {\n  // 200 lines of logic here\n}\n```\n\n';
  }
  md += '### Error Handling\n```javascript\n// ✅ Explicit\ntry {\n  await riskyOperation();\n} catch (err) {\n  console.error(`Failed: ${err.message}`);\n  process.exit(1);\n}\n\n// ❌ Silent\ntry {\n  await riskyOperation();\n} catch {} // ❌ No error handling\n```\n\n';
  md += '### Async Style\n```javascript\n// ✅ async/await\nasync function loadData() {\n  const data = await fetchData();\n  return process(data);\n}\n\n// ❌ Callbacks or raw promises\nfunction loadData(callback) {\n  fetchData().then(data => callback(null, data));\n}\n```\n\n';
  
  // Import/Export Conventions (Task 3.4)
  md += '## Import/Export Conventions\n\n**Current**: CommonJS (`require`/`module.exports`)\n\n```javascript\n// ✅ Named imports (CommonJS)\nconst { foo, bar } = require(\'./utils\');\n\n// ✅ Module exports\nmodule.exports = { foo, bar };\n\n// ✅ Single export (entry points)\nmodule.exports = main;\nfunction main() {}\n\n// ✅ Alphabetize imports\nconst { a, b, c } = require(\'./foo\');\nconst { x, y, z } = require(\'./bar\');\n\n// ❌ Avoid mixing module systems\nconst foo = require(\'./foo\');\nexport const bar = \'bar\';  // ❌ Don\'t mix CommonJS + ES modules\n```\n\n**Note**: Planning migration to ES modules (see issue #112)\n\n';
  
  // Test Conventions (Task 3.5)
  md += '## Test Conventions\n\n**Location**: Co-locate or `tests/` directory\n```\nfoo.js\nfoo.test.js  ✅\n```\n\n**Naming**:\n```javascript\n// ✅ Descriptive\ntest(\'loads config from .ai-coding-guide.json\', () => {});\n\n// ❌ Vague\ntest(\'it works\', () => {});\n```\n\n**Note**: Test files exempt from line/complexity limits\n\n';
  
  // Documentation Requirements (Task 3.6)
  md += '## Documentation\n\n**Required**:\n- JSDoc for public functions\n- README.md in feature directories\n- Examples for complex logic\n\n**Example**:\n```javascript\n/**\n * Generate ESLint config from domain configuration\n * @param {Object} config - Domain configuration\n * @param {Object} domains - Available domains\n * @returns {string} ESLint config file content\n */\nexport async function generateEslintConfig(config, domains) {\n  // ...\n}\n```\n\n';
  
  // Anti-Patterns (Task 3.8)
  md += '## Anti-Patterns\n\n**Avoid:**\n- ❌ **Monolithic files** (>250 lines) - Split into smaller modules\n- ❌ **Long functions** (>50 lines) - Extract helper functions\n- ❌ **Deep nesting** (>4 levels) - Early returns or separate functions\n- ❌ **Silent errors** - Always log/handle errors explicitly\n- ❌ **Global state** - Use parameters and return values\n- ❌ **Magic numbers** - Use named constants';
  
  // Add forbidden names if they exist
  const forbiddenNames = cfg.antiPatterns && cfg.antiPatterns.forbiddenNames || [];
  if (forbiddenNames.length > 0) {
    md += `\n- ❌ **Generic names** - Avoid: ` + '`' + forbiddenNames.join('`, `') + '`';
  }
  
  md += '\n\n';
  
  // Ambiguity tactics
  md += `\n## Ambiguity Tactics\n- Prefer explicit @domain/@domains on ambiguous constants\n- Use name cues (e.g., 'circleAngleDegrees')\n- Project-wide mapping via .ai-coding-guide.json → constantResolution\n\n---\n*See .ai-coding-guide.md for details*\n`;
  fs.writeFileSync(file, md);
  console.log(`Wrote ${file}`);
}

module.exports = { writeAgentsMd };
