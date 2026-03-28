/**
 * Run tests with coverage in Lunara and backend, then fix LCOV paths for Sonar.
 * Usage: node scripts/run-coverage.js
 * Run from repo root (e.g. E:\AQC).
 */
const { spawnSync } = require('child_process');
const path = require('path');
const pathSep = path.sep;
const root = path.resolve(__dirname, '..');

function run(cwd, command, args) {
  const result = spawnSync(command, args, {
    cwd,
    shell: true,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('Running Lunara tests with coverage...');
run(path.join(root, 'Lunara'), 'npm', ['test', '--', '--coverage']);

console.log('Running backend tests with coverage...');
run(path.join(root, 'backend'), 'npm', ['test', '--', '--coverage']);

console.log('Fixing LCOV paths for Sonar...');
require('./fix-lcov-paths.js');

console.log('Done. Run: npx @sonar/scan (or with SONAR_TOKEN and -Dsonar.scm.disabled=true)');