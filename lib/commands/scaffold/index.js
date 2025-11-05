'use strict';

const fs = require('fs');
const path = require('path');

function scaffoldCommand(cwd, domainArg, outDirArg) {
  const domain = String(domainArg || '').trim();
  if (!domain) { 
    console.error('Missing domain. Usage: eslint-plugin-ai-code-snifftest scaffold <domain> [--dir=path]'); 
    return 1; 
  }
  const outDir = path.resolve(cwd, outDirArg || `./${domain}`);
  fs.mkdirSync(outDir, { recursive: true });
  const pkgName = `@ai-constants/${domain}`;
  const indexJs = `module.exports = {\n  domain: '${domain}',\n  version: '1.0.0',\n  constants: [\n    { value: 42, name: 'EXAMPLE_CONSTANT', description: 'Example constant for ${domain}' }\n  ],\n  terms: { entities: ['Entity1'], properties: ['property1'], actions: ['action1'] },\n  naming: { style: 'camelCase', booleanPrefix: ['is','has','should'], constants: 'UPPER_SNAKE_CASE' }\n};\n`;
  const pkgJson = { name: pkgName, version: '1.0.0', main: 'index.js', license: 'MIT' };
  const readme = `# ${pkgName}\n\nExternal constants package for the ${domain} domain.\n`;
  const testDir = path.join(outDir, 'test');
  fs.writeFileSync(path.join(outDir, 'index.js'), indexJs);
  fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify(pkgJson, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'README.md'), readme);
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(path.join(testDir, 'validate.test.js'), `/* placeholder tests */\n`);
  console.log(`Scaffolded external constants package at ${outDir}`);
  return 0;
}

module.exports = { scaffoldCommand };
