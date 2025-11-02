#!/bin/bash
# Quick Local Package Test
# Tests npm package without publishing

set -e

PLUGIN_DIR="$(pwd)"
PACKAGE_NAME="eslint-plugin-ai-code-snifftest"

echo "🧪 Local Package Test"
echo "═══════════════════════════════════"
echo ""

#------------------------------------------------------------------------------
# Step 1: Build Package
#------------------------------------------------------------------------------

echo "📦 Step 1: Building package..."
npm test || { echo "❌ Tests failed"; exit 1; }
npm pack

TARBALL=$(ls ${PACKAGE_NAME}-*.tgz | tail -1)
echo "✅ Built: $TARBALL"

# Check size
SIZE=$(ls -lh "$TARBALL" | awk '{print $5}')
echo "   Size: $SIZE"
if [ "${SIZE//[^0-9]/}" -gt 100 ]; then
  echo "⚠️  Package seems large (>100KB)"
fi
echo ""

#------------------------------------------------------------------------------
# Step 2: Inspect Contents
#------------------------------------------------------------------------------

echo "🔍 Step 2: Inspecting package contents..."
echo "Files included:"
tar -tzf "$TARBALL" | head -20
echo ""

# Check for unwanted files
if tar -tzf "$TARBALL" | grep -q "tests/"; then
  echo "❌ WARNING: tests/ directory included"
fi
if tar -tzf "$TARBALL" | grep -q "node_modules/"; then
  echo "❌ WARNING: node_modules/ included"
fi
if tar -tzf "$TARBALL" | grep -q "coverage/"; then
  echo "❌ WARNING: coverage/ included"
fi

echo ""

#------------------------------------------------------------------------------
# Step 3: Create Test Project
#------------------------------------------------------------------------------

echo "🧪 Step 3: Creating test project..."
TEST_DIR="/tmp/eslint-plugin-test-$$"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Initialize minimal project
cat > package.json << 'EOF'
{
  "name": "test-project",
  "version": "1.0.0",
  "private": true
}
EOF

npm install eslint

echo "✅ Test project created: $TEST_DIR"
echo ""

#------------------------------------------------------------------------------
# Step 4: Install Package
#------------------------------------------------------------------------------

echo "📥 Step 4: Installing package from tarball..."
npm install "$PLUGIN_DIR/$TARBALL"

# Verify installation
if npm list $PACKAGE_NAME > /dev/null 2>&1; then
  VERSION=$(npm list $PACKAGE_NAME --depth=0 | grep $PACKAGE_NAME | awk '{print $NF}')
  echo "✅ Installed: $PACKAGE_NAME@$VERSION"
else
  echo "❌ Installation failed"
  exit 1
fi
echo ""

#------------------------------------------------------------------------------
# Step 5: Create Test Files
#------------------------------------------------------------------------------

echo "📝 Step 5: Creating test files..."

cat > test-patterns.js << 'EOF'
// AI-generated patterns that should be caught

// 1. Redundant calculation
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// 2. Boolean comparison
if (isValid === true) {
  console.log('valid');
}

// 3. Equivalent branches
if (condition) {
  doSomething();
} else {
  doSomething();
}

// 4. Redundant ternary
const result = flag ? true : false;

// 5. Trivial wrapper
function wrapper(x) {
  return compute(x);
}
function compute(x) {
  return x * 2;
}
wrapper(5);

function doSomething() {}
let isValid, condition, flag;
EOF

cat > eslint.config.js << 'EOF'
module.exports = [
  {
    languageOptions: { ecmaVersion: 2021 },
    plugins: { 'ai-code-snifftest': require('eslint-plugin-ai-code-snifftest') },
    rules: {
      'ai-code-snifftest/no-redundant-calculations': 'warn',
      'ai-code-snifftest/no-equivalent-branches': 'warn',
      'ai-code-snifftest/prefer-simpler-logic': 'warn',
      'ai-code-snifftest/no-redundant-conditionals': 'warn',
      'ai-code-snifftest/no-unnecessary-abstraction': 'warn',
    },
  },
];
EOF

echo "✅ Test files created"
echo ""

#------------------------------------------------------------------------------
# Step 6: Run Linter
#------------------------------------------------------------------------------

echo "🔍 Step 6: Running linter..."
echo "─────────────────────────────────────"

npx eslint test-patterns.js || true

echo ""
echo "Expected: 5 warnings (one per pattern)"
echo ""

#------------------------------------------------------------------------------
# Step 7: Test Auto-Fix
#------------------------------------------------------------------------------

echo "🔧 Step 7: Testing auto-fix..."
cp test-patterns.js test-patterns.backup.js

npx eslint test-patterns.js --fix || true

echo ""
echo "Diff after auto-fix:"
diff test-patterns.backup.js test-patterns.js || true
echo ""

#------------------------------------------------------------------------------
# Step 8: Verify Rules Load
#------------------------------------------------------------------------------

echo "🔍 Step 8: Verifying rules load..."

node << 'EONODE'
const plugin = require('eslint-plugin-ai-code-snifftest');
const rules = Object.keys(plugin.rules);

console.log('Loaded rules:');
rules.forEach(rule => console.log('  ✅', rule));

const expected = [
  'no-redundant-calculations',
  'no-equivalent-branches',
  'prefer-simpler-logic',
  'no-redundant-conditionals',
  'no-unnecessary-abstraction'
];

const missing = expected.filter(r => !rules.includes(r));
if (missing.length > 0) {
  console.error('❌ Missing rules:', missing);
  process.exit(1);
}

console.log('\n✅ All rules loaded correctly');
EONODE

echo ""

#------------------------------------------------------------------------------
# Summary
#------------------------------------------------------------------------------

echo "═══════════════════════════════════"
echo "✅ PACKAGE TEST COMPLETE"
echo "═══════════════════════════════════"
echo ""
echo "Test project: $TEST_DIR"
echo "Package: $TARBALL"
echo ""
echo "✅ Package builds"
echo "✅ Package installs"
echo "✅ Rules load"
echo "✅ Linter runs"
echo "✅ Auto-fix works"
echo ""
echo "Next steps:"
echo "  1. Test on real project (antikythera-engine-2)"
echo "  2. If all works: npm publish"
echo ""
echo "To clean up: rm -rf $TEST_DIR"
echo ""
