#!/usr/bin/env node
/**
 * Run all bundle scripts in sequence:
 *   1. bundle-node.mjs
 *   2. bundle-openclaw.mjs
 *   3. bundle-python.mjs (Windows only)
 *
 * Usage:
 *   node scripts/bundle-all.mjs
 */
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const SCRIPTS_DIR = join(process.cwd(), 'scripts');

function run(scriptName) {
  const scriptPath = join(SCRIPTS_DIR, scriptName);
  if (!existsSync(scriptPath)) {
    console.error(`[bundle-all] Script not found: ${scriptPath}`);
    process.exit(1);
  }
  console.log(`\n[bundle-all] ========== Running ${scriptName} ==========`);
  execSync(`node ${scriptPath}`, { stdio: 'inherit', cwd: process.cwd() });
}

async function main() {
  run('bundle-node.mjs');
  run('bundle-openclaw.mjs');
  if (process.platform === 'win32') {
    run('bundle-python.mjs');
  } else {
    console.log('[bundle-all] Skipping bundle-python.mjs (non-Windows)');
  }
  console.log('\n[bundle-all] ========== All bundles complete ==========');
}

main().catch((err) => {
  console.error('[bundle-all] Failed:', err.message);
  process.exit(1);
});
