/**
 * Detect project type and tech stack from package.json
 * @param {string} cwd - Project root directory
 * @returns {Object} Project context with type, domains, description, techStack
 */
function detectProjectContext(cwd) {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const pkgPath = path.join(cwd, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      return { type: 'general', domains: ['cs'], description: 'Software project', techStack: [] };
    }
    
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const techStack = [];
    
    // Detect Node.js version
    if (pkg.engines && pkg.engines.node) {
      techStack.push(`Node.js ${pkg.engines.node}`);
    }
    
    // ESLint plugin?
    if (pkg.name && pkg.name.includes('eslint-plugin')) {
      techStack.push('ESLint 9+');
      return {
        type: 'dev-tools',
        domains: ['cs', 'dev-tools', 'linting'],
        description: 'ESLint plugin',
        techStack
      };
    }
    
    // CLI tool?
    if (pkg.bin) {
      techStack.push('CLI');
      return {
        type: 'cli',
        domains: ['cs', 'cli', 'node-ecosystem'],
        description: 'CLI tool',
        techStack
      };
    }
    
    // React web app?
    if (deps.react) {
      techStack.push(`React ${deps.react}`);
      if (deps.next) techStack.push('Next.js');
      return {
        type: 'web-app',
        domains: ['cs', 'web', 'ui'],
        description: 'React web application',
        techStack
      };
    }
    
    // Vue app?
    if (deps.vue) {
      techStack.push(`Vue ${deps.vue}`);
      return {
        type: 'web-app',
        domains: ['cs', 'web', 'ui'],
        description: 'Vue web application',
        techStack
      };
    }
    
    // Express/API server?
    if (deps.express || deps.koa || deps.fastify) {
      techStack.push('API server');
      return {
        type: 'api-server',
        domains: ['cs', 'backend', 'api'],
        description: 'API server',
        techStack
      };
    }
    
    // Library/package?
    if (pkg.main && !pkg.bin && !deps.react && !deps.vue) {
      return {
        type: 'library',
        domains: ['cs', 'library'],
        description: 'JavaScript library',
        techStack
      };
    }
    
    // Default
    return {
      type: 'general',
      domains: ['cs'],
      description: 'Software project',
      techStack
    };
  } catch (err) {
    return {
      type: 'general',
      domains: ['cs'],
      description: 'Software project',
      techStack: [],
      error: err.message
    };
  }
}

module.exports = { detectProjectContext };
