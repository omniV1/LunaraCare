/**
 * Fix LCOV paths so SonarQube can match them to monorepo sources.
 * Jest writes paths relative to each package (e.g. src/foo.ts); Sonar expects
 * paths relative to repo root (e.g. Lunara/src/foo.ts, backend/src/foo.ts).
 *
 * Must be run from repo root (E:\AQC), not from Lunara/ or backend/:
 *   cd E:\AQC
 *   node scripts/fix-lcov-paths.js
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
if (!fs.existsSync(path.join(REPO_ROOT, 'Lunara')) || !fs.existsSync(path.join(REPO_ROOT, 'backend'))) {
  console.error('Run this script from the repo root (E:\\AQC), not from Lunara/ or backend/.');
  console.error('  cd E:\\AQC');
  console.error('  node scripts/fix-lcov-paths.js');
  process.exit(1);
}

function fixLcovFile(lcovPath, prefix) {
  const fullPath = path.join(REPO_ROOT, lcovPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Skip (not found): ${lcovPath}`);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  // SF: is the source file path in LCOV. Prepend prefix and use forward slashes so Sonar matches paths.
  content = content.replace(/^SF:(.+)$/gm, (_, p) => {
    let trimmed = p.trim().replace(/\\/g, '/');
    if (trimmed.startsWith(prefix)) return `SF:${trimmed}`;
    return `SF:${prefix}${trimmed}`;
  });
  fs.writeFileSync(fullPath, content);
  console.log(`Fixed: ${lcovPath} (prefix ${prefix})`);
}

fixLcovFile('Lunara/coverage/lcov.info', 'Lunara/');
fixLcovFile('backend/coverage/lcov.info', 'backend/');
console.log('Done. Run npx @sonar/scan from repo root.');
